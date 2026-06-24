// ============================================================================
//  Net (M1) - ver Net.h. WiFi STA + portal cautivo + NTP. Libs nativas.
// ============================================================================
#include "Net.h"
#include <Arduino.h>
#include <WiFi.h>
#include <WebServer.h>
#include <DNSServer.h>
#include <ESPmDNS.h>
#include <ArduinoJson.h>
#include <time.h>
#include "../app/Config.h"
#include "../app/AppState.h"
#include "../app/StateManager.h"
#include "../storage/Nvs.h"

namespace net {

enum class St : uint8_t { IDLE, CONNECTING, CONNECTED, PORTAL };

static St           s_state = St::IDLE;
static volatile bool s_portalReq = false;   // pedido de levantar portal (desde otra task)
static volatile bool s_stopReq   = false;   // pedido de bajar el portal
static RealState     s_real;                // ultimo estado real del companion (lo escribe handlePostState)
static char          s_ssid[33] = {0};      // creds guardadas (para reintentar STA sin recargar de NVS)
static char          s_pass[65] = {0};
static bool          s_haveCreds = false;
static bool          s_wifiEnabled = true;   // el usuario puede apagar el WiFi (ahorro de energia)
static volatile bool s_wifiToggleReq = false;
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
static void handlePostState() {
  if (cfg::API_TOKEN[0] && s_web.header("X-Pad-Token") != cfg::API_TOKEN) {
    s_web.send(401, "text/plain", "unauthorized"); return;
  }
  const String& body = s_web.arg("plain");
  if (body.length() == 0 || body.length() > 512) { s_web.send(400, "text/plain", "bad body"); return; }
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
  if (doc["clockMin"].is<int>()) {                 // hora real desde el companion (min desde 00:00)
    int cm = doc["clockMin"].as<int>();
    if (cm >= 0 && cm < 24 * 60) {
      appstate::prefs.clockMinute  = (uint16_t)cm;
      appstate::prefs.clockSetAtMs = millis();
    }
  }
  s_real.updatedAtMs = millis();
  s_web.send(204, "text/plain", "");
}

static void setupRoutes() {
  s_web.on("/", handleRoot);
  s_web.on("/save", HTTP_POST, handleSave);
  s_web.on("/api/state", HTTP_POST, handlePostState);
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
void toggleWifi()    { s_wifiToggleReq = true; }
bool isWifiEnabled() { return s_wifiEnabled; }

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
const char* ip()    { return s_ip; }
const char* apName(){ return cfg::WIFI_AP_NAME; }

}  // namespace net
