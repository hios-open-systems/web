// ============================================================================
//  Net (M1) - ver Net.h. WiFi STA + portal cautivo + NTP. Libs nativas.
// ============================================================================
#include "Net.h"
#include <Arduino.h>
#include <WiFi.h>
#include <WebServer.h>
#include <DNSServer.h>
#include <ESPmDNS.h>
#include <ArduinoOTA.h>
#include <ArduinoJson.h>
#include <time.h>
#include "../app/Config.h"
#include "../app/AppState.h"
#include "../app/StateManager.h"
#include "../app/EventBus.h"
#include "../app/Types.h"
#include "../mapping/KeyMap.h"
#include "../storage/Nvs.h"
#include "../storage/ConfigStore.h"
#include "../storage/ConfigCodec.h"
#include "../ui/monitor.h"
#include "UiMirror.h"

namespace net {

enum class St : uint8_t { IDLE, CONNECTING, CONNECTED, PORTAL };

static St           s_state = St::IDLE;
static volatile bool s_portalReq = false;   // pedido de levantar portal (desde otra task)
static volatile bool s_stopReq   = false;   // pedido de bajar el portal
static RealState     s_real;                // ultimo estado real del companion (lo escribe handlePostState)
static const KeyMap* s_keymap = nullptr;    // para el descriptor de capa del UI-mirror
static uint8_t       s_lastUiLayer = 0xFF;  // ultima capa serializada (manda descriptor al cambiar)
// Cola de comandos pad->companion (ring buffer; reemplaza el bitmask que se quedaba sin
// bits y coalescia repeticiones). Se llena desde inputTask (core1) y se vacia en
// handlePostState (netTask, core0) -> seccion critica para no perder ni duplicar.
static volatile CompanionCmd s_cmdQ[16];
static volatile uint8_t      s_cmdHead = 0, s_cmdTail = 0;   // head=proximo a leer, tail=proximo a escribir
static portMUX_TYPE          s_cmdMux = portMUX_INITIALIZER_UNLOCKED;
static char          s_ssid[33] = {0};      // creds guardadas (para reintentar STA sin recargar de NVS)
static char          s_pass[65] = {0};
static bool          s_haveCreds = false;
static bool          s_wifiEnabled = true;   // el usuario puede apagar el WiFi (ahorro de energia)
static volatile bool s_wifiToggleReq = false;
static volatile bool s_wifiViewReq = false;  // abrir WiFi desde el menu (mostrar estado / reconectar; portal solo si hace falta)
static WebServer  s_web(80);
static DNSServer  s_dns;
static uint32_t   s_connectStart = 0;
static uint32_t   s_lastSync = 0;
static bool       s_synced = false;
static char       s_ip[20] = "0.0.0.0";
static const byte DNS_PORT = 53;

// ---------------------------------------------------------------------------
static void setIp(IPAddress ip) { snprintf(s_ip, sizeof(s_ip), "%s", ip.toString().c_str()); }

static String htmlConfig() {
  String h = F("<!doctype html><meta charset=utf-8>"
               "<meta name=viewport content='width=device-width,initial-scale=1'>"
               "<body style='font-family:system-ui,sans-serif;max-width:420px;margin:24px auto;padding:0 16px;background:#0c0f14;color:#eef'>"
               "<h2 style='color:#1fe0e0'>HIOS PAD &middot; WiFi</h2>"
               "<form method=POST action=/save>"
               "<p>Red<br><input name=ssid list=nets style='width:100%;padding:10px;box-sizing:border-box'></p>"
               "<datalist id=nets>");
  int n = WiFi.scanNetworks();
  for (int i = 0; i < n; i++) h += "<option value='" + WiFi.SSID(i) + "'>";
  h += F("</datalist>"
         "<p>Clave<br><input name=pass type=password style='width:100%;padding:10px;box-sizing:border-box'></p>"
         "<button style='padding:10px 18px;background:#1fe0e0;border:0;border-radius:8px'>Guardar y conectar</button>"
         "</form></body>");
  return h;
}

static String htmlStatus() {
  String h = F("<!doctype html><meta charset=utf-8>"
               "<meta name=viewport content='width=device-width,initial-scale=1'>"
               "<body style='font-family:system-ui,sans-serif;max-width:420px;margin:24px auto;padding:0 16px;background:#0c0f14;color:#eef'>"
               "<h2 style='color:#3ddc84'>HIOS PAD &middot; online</h2>");
  h += "<p>IP: <b>" + String(s_ip) + "</b></p>";
  h += "<p>mDNS: <b>http://" + String(cfg::MDNS_HOST) + ".local</b></p>";
  h += "<p>Hora: <b>" + String(s_synced ? "sincronizada (NTP)" : "pendiente") + "</b></p>";
  h += F("<p style='color:#8a93a0'>Control web: proximamente (M4).</p></body>");
  return h;
}

static void handleRoot() {
  s_web.send(200, "text/html", s_state == St::PORTAL ? htmlConfig() : htmlStatus());
}

static void handleSave() {
  String ssid = s_web.arg("ssid");
  String pass = s_web.arg("pass");
  if (ssid.length() == 0) { s_web.sendHeader("Location", "/"); s_web.send(302, "text/plain", ""); return; }
  nvs::saveWifi(ssid.c_str(), pass.c_str());
  s_web.send(200, "text/html",
             F("<!doctype html><meta charset=utf-8><body style='font-family:sans-serif'>"
               "Guardado. Reiniciando para conectar...</body>"));
  delay(800);
  ESP.restart();
}

// POST /api/state: el companion (PC) empuja el estado REAL. Cuerpo JSON; todos
// los campos opcionales -> solo se pisa lo presente. Responde 204 (sin body).
// CompanionCmd -> string del contrato (lo entiende el companion en index.ts).
static const char* cmdName(CompanionCmd c) {
  switch (c) {
    case CompanionCmd::MIC_TOGGLE:      return "micToggle";
    case CompanionCmd::CAM_TOGGLE:      return "camToggle";
    case CompanionCmd::WIZ_TOGGLE:      return "wizToggle";
    case CompanionCmd::WIZ_BRIGHT_UP:   return "wizBrightUp";
    case CompanionCmd::WIZ_BRIGHT_DOWN: return "wizBrightDown";
    case CompanionCmd::WIZ_WARMER:      return "wizWarmer";
    case CompanionCmd::WIZ_COOLER:      return "wizCooler";
    case CompanionCmd::WIZ_ROOM_NEXT:   return "wizRoomNext";
    case CompanionCmd::WIZ_LIGHT_NEXT:  return "wizLightNext";
    default:                            return nullptr;
  }
}

static void handlePostState() {
  if (cfg::API_TOKEN[0] && s_web.header("X-Pad-Token") != cfg::API_TOKEN) {
    s_web.send(401, "text/plain", "unauthorized"); return;
  }
  const String& body = s_web.arg("plain");
  if (body.length() == 0 || body.length() > 3072) { s_web.send(400, "text/plain", "bad body"); return; }
  JsonDocument doc;
  if (deserializeJson(doc, body)) { s_web.send(400, "text/plain", "bad json"); return; }
  if (doc["mic"].is<bool>())      s_real.micMuted  = doc["mic"].as<bool>();
  if (doc["cam"].is<bool>())      s_real.camOff    = doc["cam"].as<bool>();
  if (doc["media"].is<bool>())    s_real.mediaPlay = doc["media"].as<bool>();
  if (doc["vol"].is<int>())       s_real.volume    = constrain(doc["vol"].as<int>(), 0, 100);
  if (doc["cpuTemp"].is<float>()) s_real.cpuTemp   = (int16_t)doc["cpuTemp"].as<float>();
  if (doc["gpuTemp"].is<float>()) s_real.gpuTemp   = (int16_t)doc["gpuTemp"].as<float>();
  if (doc["cpuLoad"].is<int>())   s_real.cpuLoad   = constrain(doc["cpuLoad"].as<int>(), 0, 100);
  if (doc["gpuLoad"].is<int>())   s_real.gpuLoad   = constrain(doc["gpuLoad"].as<int>(), 0, 100);
  if (doc["cpuFan"].is<int>())    s_real.cpuFan    = (int16_t)doc["cpuFan"].as<int>();
  if (doc["gpuFan"].is<int>())    s_real.gpuFan    = (uint8_t)constrain(doc["gpuFan"].as<int>(), 0, 100);
  if (doc["ram"].is<int>())       s_real.ram       = (uint8_t)constrain(doc["ram"].as<int>(), 0, 100);
  if (doc["netDown"].is<int>())   s_real.netDown   = (uint32_t)(doc["netDown"].as<int>() < 0 ? 0 : doc["netDown"].as<int>());
  if (doc["netUp"].is<int>())     s_real.netUp     = (uint32_t)(doc["netUp"].as<int>() < 0 ? 0 : doc["netUp"].as<int>());
  if (doc["ip"].is<const char*>()) strlcpy(s_real.ip, doc["ip"].as<const char*>(), sizeof(s_real.ip));
  if (doc["cores"].is<JsonArray>()) {
    JsonArray a = doc["cores"].as<JsonArray>();
    uint8_t n = 0;
    for (JsonVariant v : a) { if (n >= 24) break; s_real.cores[n++] = (uint8_t)constrain(v.as<int>(), 0, 100); }
    s_real.coreCount = n;
  }
  if (doc["vramUsed"].is<int>())  s_real.vramUsed  = (uint16_t)constrain(doc["vramUsed"].as<int>(), 0, 65534);
  if (doc["vramTotal"].is<int>()) s_real.vramTotal = (uint16_t)constrain(doc["vramTotal"].as<int>(), 0, 65535);
  if (doc["uptime"].is<long>())   s_real.uptimeSec = (uint32_t)(doc["uptime"].as<long>() < 0 ? 0 : doc["uptime"].as<long>());
  if (doc["procs"].is<int>())     s_real.procs     = (uint16_t)constrain(doc["procs"].as<int>(), 0, 65534);
  if (doc["disk"].is<int>())      s_real.diskPct   = (uint8_t)constrain(doc["disk"].as<int>(), 0, 100);
  if (doc["diskRd"].is<long>())   s_real.diskRd    = (uint32_t)(doc["diskRd"].as<long>() < 0 ? 0 : doc["diskRd"].as<long>());
  if (doc["diskWr"].is<long>())   s_real.diskWr    = (uint32_t)(doc["diskWr"].as<long>() < 0 ? 0 : doc["diskWr"].as<long>());
  // Pre-carga de historial de throughput (KB/s) -> el monitor lo seedea si esta vacio.
  if (doc["hist"].is<JsonObject>()) {
    JsonObject h = doc["hist"].as<JsonObject>();
    uint16_t a0[56], a1[56];
    if (h["nd"].is<JsonArray>() && h["nu"].is<JsonArray>()) {
      int n = 0; for (JsonVariant v : h["nd"].as<JsonArray>()) { if (n >= 56) break; long x = v.as<long>(); a0[n++] = (uint16_t)(x < 0 ? 0 : (x > 65535 ? 65535 : x)); }
      int m = 0; for (JsonVariant v : h["nu"].as<JsonArray>()) { if (m >= n) break; long x = v.as<long>(); a1[m++] = (uint16_t)(x < 0 ? 0 : (x > 65535 ? 65535 : x)); }
      monitor::seedNetHist(a0, a1, n);
    }
    if (h["dr"].is<JsonArray>() && h["dw"].is<JsonArray>()) {
      int n = 0; for (JsonVariant v : h["dr"].as<JsonArray>()) { if (n >= 56) break; long x = v.as<long>(); a0[n++] = (uint16_t)(x < 0 ? 0 : (x > 65535 ? 65535 : x)); }
      int m = 0; for (JsonVariant v : h["dw"].as<JsonArray>()) { if (m >= n) break; long x = v.as<long>(); a1[m++] = (uint16_t)(x < 0 ? 0 : (x > 65535 ? 65535 : x)); }
      monitor::seedDiskHist(a0, a1, n);
    }
  }
  if (doc["wizRoom"].is<const char*>())   strlcpy(s_real.wizRoom,   doc["wizRoom"].as<const char*>(),   sizeof(s_real.wizRoom));
  if (doc["wizTarget"].is<const char*>()) strlcpy(s_real.wizTarget, doc["wizTarget"].as<const char*>(), sizeof(s_real.wizTarget));
  if (doc["wizOn"].is<bool>())            s_real.wizOn     = doc["wizOn"].as<bool>();
  if (doc["wizBright"].is<int>())         s_real.wizBright = (uint8_t)constrain(doc["wizBright"].as<int>(), 0, 100);
  if (doc["os"].is<const char*>())        strlcpy(s_real.os, doc["os"].as<const char*>(), sizeof(s_real.os));
  if (doc["clockMin"].is<int>()) {                 // hora real desde el companion (min desde 00:00)
    int cm = doc["clockMin"].as<int>();
    if (cm >= 0 && cm < 24 * 60) {
      appstate::prefs.clockMinute  = (uint16_t)cm;
      appstate::prefs.clockSetAtMs = millis();
    }
  }
  s_real.updatedAtMs = millis();

  // El companion pide el blob de UI-mirror solo cuando hay un browser mirando
  // (wantUi) -> idle sin espejo mantiene el camino liviano (204). uiFull fuerza
  // el descriptor de capa (al conectar un browser nuevo).
  const bool wantUi = doc["wantUi"].as<bool>();
  const bool uiFull = doc["uiFull"].as<bool>();

  // Respuesta: comandos pendientes para el companion (los limpiamos) y/o el blob
  // de UI-mirror. Si no hay ni uno ni otro -> 204 sin body (igual que antes).
  CompanionCmd batch[16]; int nb = 0;
  portENTER_CRITICAL(&s_cmdMux);
  while (s_cmdHead != s_cmdTail && nb < 16) {
    batch[nb++] = (CompanionCmd)s_cmdQ[s_cmdHead];
    s_cmdHead = (uint8_t)((s_cmdHead + 1) % 16);
  }
  portEXIT_CRITICAL(&s_cmdMux);

  if (wantUi || nb > 0) {
    JsonDocument res;
    if (nb > 0) {
      JsonArray arr = res["cmds"].to<JsonArray>();
      for (int i = 0; i < nb; i++) { const char* n = cmdName(batch[i]); if (n) arr.add(n); }
    }
    if (wantUi) {
      UiSnapshot snap{};
      xQueuePeek(bus::uiMailbox, &snap, 0);                       // ultimo frame (no bloquea)
      bool inclLayer = uiFull || snap.activeLayer != s_lastUiLayer;
      s_lastUiLayer = snap.activeLayer;
      JsonObject ui = res["ui"].to<JsonObject>();
      mirror::serializeUi(ui, snap, s_keymap, inclLayer);
      ui["os"] = s_real.os;                                       // SO detectado por el companion
    }
    String out; serializeJson(res, out);
    s_web.send(200, "application/json", out);
  } else {
    s_web.send(204, "text/plain", "");
  }
}

// GET /api/config: serializa el keymap actual (capas/bindings/acciones/labels).
static void handleGetConfig() {
  if (cfg::API_TOKEN[0] && s_web.header("X-Pad-Token") != cfg::API_TOKEN) { s_web.send(401, "text/plain", "unauthorized"); return; }
  if (!s_keymap) { s_web.send(503, "text/plain", "no keymap"); return; }
  JsonDocument doc;
  cfgcodec::toJson(*s_keymap, doc.to<JsonObject>());
  String out; serializeJson(doc, out);
  s_web.send(200, "application/json", out);
}

// POST /api/config: valida + guarda en LittleFS + REINICIA (se aplica en el boot).
// No swap en caliente: mas seguro entre cores (mismo patron que el guardado de WiFi).
static void handlePostConfig() {
  if (cfg::API_TOKEN[0] && s_web.header("X-Pad-Token") != cfg::API_TOKEN) { s_web.send(401, "text/plain", "unauthorized"); return; }
  const String& body = s_web.arg("plain");
  if (body.length() == 0 || body.length() > 49152) { s_web.send(400, "text/plain", "bad body"); return; }
  JsonDocument doc;
  if (deserializeJson(doc, body)) { s_web.send(400, "text/plain", "bad json"); return; }
  if (!doc["layers"].is<JsonArray>()) { s_web.send(400, "text/plain", "no layers"); return; }
  if (!cfgstore::save(body.c_str(), body.length())) { s_web.send(500, "text/plain", "save failed"); return; }
  s_web.send(200, "application/json", "{\"ok\":true,\"reboot\":true}");
  delay(300);
  ESP.restart();
}

// POST /api/config/reset: borra /config.json + reinicia -> vuelve a defaults compilados.
static void handleResetConfig() {
  if (cfg::API_TOKEN[0] && s_web.header("X-Pad-Token") != cfg::API_TOKEN) { s_web.send(401, "text/plain", "unauthorized"); return; }
  cfgstore::remove();
  s_web.send(200, "application/json", "{\"ok\":true,\"reboot\":true}");
  delay(300);
  ESP.restart();
}

static void setupRoutes() {
  s_web.on("/", handleRoot);
  s_web.on("/save", HTTP_POST, handleSave);
  s_web.on("/api/state", HTTP_POST, handlePostState);
  s_web.on("/api/config", HTTP_GET, handleGetConfig);
  s_web.on("/api/config", HTTP_POST, handlePostConfig);
  s_web.on("/api/config/reset", HTTP_POST, handleResetConfig);
  const char* hdrs[] = {"X-Pad-Token"};         // necesario para leer el header del token
  s_web.collectHeaders(hdrs, 1);
  s_web.onNotFound([]() {                       // captive: redirige todo a "/"
    s_web.sendHeader("Location", String("http://") + s_ip + "/", true);
    s_web.send(302, "text/plain", "");
  });
}

static void startPortal() {
  WiFi.mode(WIFI_AP_STA);                        // AP_STA para poder escanear redes
  WiFi.softAP(cfg::WIFI_AP_NAME);
  IPAddress ip = WiFi.softAPIP();
  setIp(ip);
  s_dns.start(DNS_PORT, "*", ip);
  setupRoutes();
  s_web.begin();
  s_state = St::PORTAL;
  Serial.printf("[net] portal '%s' en http://%s\n", cfg::WIFI_AP_NAME, s_ip);
}

static void onConnected() {
  setIp(WiFi.localIP());
  MDNS.begin(cfg::MDNS_HOST);
  MDNS.addService("http", "tcp", 80);
  ArduinoOTA.setHostname(cfg::MDNS_HOST);          // flasheo wireless: pio run -t upload --upload-port hiospad.local
  ArduinoOTA.begin();
  configTzTime(cfg::NTP_TZ, cfg::NTP_SERVER);
  setupRoutes();
  s_web.begin();
  s_lastSync = 0;                                // forzar primer sync
  s_state = St::CONNECTED;
  Serial.printf("[net] STA OK ip=%s  http://%s.local\n", s_ip, cfg::MDNS_HOST);
}

static void trySyncClock() {
  struct tm t;
  if (getLocalTime(&t, 50)) {
    appstate::prefs.clockMinute  = t.tm_hour * 60 + t.tm_min;
    appstate::prefs.clockSetAtMs = millis();
    s_synced = true;
  }
}

// ---------------------------------------------------------------------------
void begin() {
  WiFi.persistent(false);
  WiFi.mode(WIFI_STA);
  WiFi.setSleep(true);                           // modem-sleep: ahorro de bateria
  WiFi.setTxPower(WIFI_POWER_11dBm);             // picos de corriente mas chicos -> menos brownout con fuente floja
  s_haveCreds = nvs::loadWifi(s_ssid, sizeof(s_ssid), s_pass, sizeof(s_pass));
  if (s_haveCreds) {
    WiFi.begin(s_ssid, s_pass);
    s_connectStart = millis();
    s_state = St::CONNECTING;
    Serial.printf("[net] conectando a '%s'...\n", s_ssid);
  } else {
    // Sin credenciales: NO forzamos el portal. El pad queda usable offline; el
    // portal se levanta a demanda desde el menu (net::requestPortal()).
    s_state = St::IDLE;
    Serial.println("[net] sin credenciales -> offline (portal a demanda desde el menu)");
  }
}

void requestPortal() { s_portalReq = true; }
void stopPortal()    { s_stopReq = true; }
void openWifi()      { s_wifiViewReq = true; }   // abrir WiFi "inteligente" (estado/reconexion, no portal forzado)
void toggleWifi()    { s_wifiToggleReq = true; }
bool isWifiEnabled() { return s_wifiEnabled; }
const char* ssid()   { return s_ssid; }

// Baja el AP/portal y deja la radio en STA idle (sin reconectar).
static void teardownPortal() {
  s_web.stop();
  s_dns.stop();
  WiFi.softAPdisconnect(true);
  WiFi.mode(WIFI_STA);
  s_state = St::IDLE;
  setIp(IPAddress(0, 0, 0, 0));
  Serial.println("[net] portal cerrado -> offline");
}

void tick() {
  // Pedidos cross-task (los atiende SIEMPRE netTask, dueno de la radio).
  if (s_portalReq) { s_portalReq = false; if (s_state != St::PORTAL) startPortal(); }
  if (s_stopReq)   { s_stopReq = false;   if (s_state == St::PORTAL) teardownPortal(); }
  // Abrir WiFi desde el menu: NO forzar el portal. Si hay creds, reconectar (o ya estar
  // conectado) y mostrar el estado; el portal de re-registro solo si no hay creds.
  if (s_wifiViewReq) {
    s_wifiViewReq = false;
    s_wifiEnabled = true;
    if (!s_haveCreds) {
      if (s_state != St::PORTAL) startPortal();                 // primera vez -> setup con QR
    } else if (s_state != St::CONNECTED && s_state != St::CONNECTING) {
      begin();                                                  // tiene creds -> reconectar (sin portal)
    }
    // CONNECTING/CONNECTED: no tocar, la UI muestra el estado.
  }
  if (s_wifiToggleReq) {
    s_wifiToggleReq = false;
    if (s_wifiEnabled) {                          // apagar el radio (ahorro de energia)
      s_web.stop(); s_dns.stop();
      WiFi.disconnect(true);
      WiFi.mode(WIFI_OFF);
      s_wifiEnabled = false; s_state = St::IDLE;
      setIp(IPAddress(0, 0, 0, 0));
      Serial.println("[net] WiFi OFF (usuario)");
    } else {                                      // re-prender y reconectar
      s_wifiEnabled = true;
      Serial.println("[net] WiFi ON (usuario)");
      begin();
    }
  }

  switch (s_state) {
    case St::CONNECTING:
      if (WiFi.status() == WL_CONNECTED) onConnected();
      else if (millis() - s_connectStart > cfg::WIFI_CONNECT_MS) {
        // Reintenta STA en vez de caer al portal AP (que come heap y no hace falta:
        // las creds son validas, el connect es lento). El portal queda on-demand (menu).
        Serial.println("[net] timeout STA, reintentando...");
        WiFi.disconnect();
        if (s_haveCreds) WiFi.begin(s_ssid, s_pass);
        s_connectStart = millis();
      }
      break;
    case St::CONNECTED:
      ArduinoOTA.handle();
      s_web.handleClient();
      if (WiFi.status() != WL_CONNECTED) { s_state = St::CONNECTING; s_connectStart = millis(); break; }
      if (s_lastSync == 0 || millis() - s_lastSync > cfg::NTP_RESYNC_MS) {
        trySyncClock();
        s_lastSync = millis();
      }
      break;
    case St::PORTAL:
      s_dns.processNextRequest();
      s_web.handleClient();
      break;
    default:
      break;
  }
}

bool isConnected()  { return s_state == St::CONNECTED; }
bool portalActive() { return s_state == St::PORTAL; }
bool timeSynced()   { return s_synced; }

bool hasFreshState(uint32_t now) {
  return s_real.updatedAtMs != 0 && (now - s_real.updatedAtMs) < cfg::STATE_FRESH_MS;
}
const RealState& realState() { return s_real; }

void setKeyMap(const KeyMap* km) { s_keymap = km; }   // para el descriptor de capa del mirror

void queueCommand(CompanionCmd cmd) {
  if (cmd == CompanionCmd::NONE) return;
  portENTER_CRITICAL(&s_cmdMux);
  uint8_t next = (uint8_t)((s_cmdTail + 1) % 16);
  if (next != s_cmdHead) { s_cmdQ[s_cmdTail] = cmd; s_cmdTail = next; }   // si esta llena, descarta el nuevo
  portEXIT_CRITICAL(&s_cmdMux);
}
const char* ip()    { return s_ip; }
const char* apName(){ return cfg::WIFI_AP_NAME; }

}  // namespace net
