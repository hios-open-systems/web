// ============================================================================
//  Net (M1) - ver Net.h. WiFi STA + portal cautivo + NTP. Libs nativas.
// ============================================================================
#include "Net.h"
#include <Arduino.h>
#include <WiFi.h>
#include <WebServer.h>
#include <DNSServer.h>
#include <ESPmDNS.h>
#include <time.h>
#include "../app/Config.h"
#include "../app/AppState.h"
#include "../storage/Nvs.h"

namespace net {

enum class St : uint8_t { IDLE, CONNECTING, CONNECTED, PORTAL };

static St           s_state = St::IDLE;
static volatile bool s_portalReq = false;   // pedido de levantar portal (desde otra task)
static volatile bool s_stopReq   = false;   // pedido de bajar el portal
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

static void setupRoutes() {
  s_web.on("/", handleRoot);
  s_web.on("/save", HTTP_POST, handleSave);
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
  char ssid[33] = {0}, pass[65] = {0};
  WiFi.persistent(false);
  WiFi.mode(WIFI_STA);
  WiFi.setSleep(true);                           // modem-sleep: ahorro de bateria
  if (nvs::loadWifi(ssid, sizeof(ssid), pass, sizeof(pass))) {
    WiFi.begin(ssid, pass);
    s_connectStart = millis();
    s_state = St::CONNECTING;
    Serial.printf("[net] conectando a '%s'...\n", ssid);
  } else {
    // Sin credenciales: NO forzamos el portal. El pad queda usable offline; el
    // portal se levanta a demanda desde el menu (net::requestPortal()).
    s_state = St::IDLE;
    Serial.println("[net] sin credenciales -> offline (portal a demanda desde el menu)");
  }
}

void requestPortal() { s_portalReq = true; }
void stopPortal()    { s_stopReq = true; }

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

  switch (s_state) {
    case St::CONNECTING:
      if (WiFi.status() == WL_CONNECTED) onConnected();
      else if (millis() - s_connectStart > cfg::WIFI_CONNECT_MS) {
        Serial.println("[net] timeout STA -> portal");
        startPortal();
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
const char* ip()    { return s_ip; }
const char* apName(){ return cfg::WIFI_AP_NAME; }

}  // namespace net
