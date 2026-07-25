#include "Net.h"
#include <Arduino.h>
#include <WiFi.h>
#include <WebServer.h>
#include <ESPmDNS.h>
#include "SongFormat.h"
#include "SongModel.h"
#include "Store.h"
#include "AudioEngine.h"
#include "DefaultSong.h"
#include "WebUi.h"

#ifndef WIFI_SSID
#define WIFI_SSID "CAMBIAME"
#endif
#ifndef WIFI_PASS
#define WIFI_PASS "CAMBIAME"
#endif
#ifndef PLAYER_MDNS
#define PLAYER_MDNS "hioschip"
#endif

namespace net {

namespace {

WebServer g_server(80);

// Doble buffer de canciones subidas: nunca se pisa la que esta sonando.
DeviceSong g_songs[2];
int g_cur = -1;
const DeviceSong* g_active = nullptr;  // para /api/status

void setActive(const DeviceSong* s) {
  g_active = s;
  audio::swap(s);
}

// ─── handlers ───────────────────────────────────────────────────────────────

void handleRoot() {
  g_server.send_P(200, "text/html", webui::PAGE);
}

void handleManifest() {
  g_server.send_P(200, "application/manifest+json", webui::MANIFEST);
}

void handleStatus() {
  const DeviceSong* s = g_active;
  String j = "{";
  j += "\"playing\":" + String(audio::playing() ? "true" : "false");
  j += ",\"name\":\"" + String(s ? s->name : "") + "\"";
  j += ",\"bpm\":" + String(s ? s->bpm : 0);
  j += ",\"tracks\":" + String(s ? s->trackCount : 0);
  j += ",\"notes\":" + String(s ? s->noteCount : 0);
  j += ",\"voices\":" + String(audio::voices());
  j += ",\"heap\":" + String((uint32_t)ESP.getFreeHeap());
  j += ",\"ip\":\"" + WiFi.localIP().toString() + "\"";
  j += "}";
  g_server.send(200, "application/json", j);
}

void handleSong() {
  if (!g_server.hasArg("plain")) {
    g_server.send(400, "application/json", "{\"ok\":false,\"err\":\"no body\"}");
    return;
  }
  const String& body = g_server.arg("plain");
  if (body.length() > songfmt::MAX_WIRE_BYTES) {
    g_server.send(413, "application/json", "{\"ok\":false,\"err\":\"too large\"}");
    return;
  }
  int next = (g_cur + 1) & 1;
  ParseResult r = parseDeviceSong(body.c_str(), body.length(), g_songs[next]);
  if (!r.ok) {
    g_server.send(400, "application/json", "{\"ok\":false,\"err\":\"bad song\"}");
    return;
  }
  g_cur = next;
  store::save(body.c_str(), body.length());
  setActive(&g_songs[next]);
  audio::play();
  String j = "{\"ok\":true,\"tracks\":" + String(r.tracks) +
             ",\"notes\":" + String(r.notes) +
             ",\"dropped\":" + String(r.dropped) + "}";
  g_server.send(200, "application/json", j);
}

void handlePlay() {
  audio::play();
  g_server.send(200, "application/json", "{\"ok\":true}");
}

void handleStop() {
  audio::stop();
  g_server.send(200, "application/json", "{\"ok\":true}");
}

void setupRoutes() {
  g_server.on("/", HTTP_GET, handleRoot);
  g_server.on("/manifest.webmanifest", HTTP_GET, handleManifest);
  g_server.on("/api/status", HTTP_GET, handleStatus);
  g_server.on("/api/song", HTTP_POST, handleSong);
  g_server.on("/api/play", HTTP_POST, handlePlay);
  g_server.on("/api/stop", HTTP_POST, handleStop);
  g_server.onNotFound([]() { g_server.send(404, "text/plain", "not found"); });
}

}  // namespace

void begin() {
  // 1) cancion guardada o default -> a sonar YA (independiente de la red)
  if (store::loadInto(g_songs[0])) {
    g_cur = 0;
    setActive(&g_songs[0]);
    Serial.printf("[net] cancion cargada de flash: %s\n", g_songs[0].name);
  } else {
    setActive(&defaultSong());
    Serial.println("[net] sin cancion guardada -> DefaultSong");
  }
  audio::play();

  // 2) WiFi (opcional): si no conecta, seguimos tocando local
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  Serial.printf("[net] conectando a WiFi \"%s\"...\n", WIFI_SSID);
  uint32_t t0 = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - t0 < 12000) delay(250);

  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("[net] WiFi OK, IP: ");
    Serial.println(WiFi.localIP());
    if (MDNS.begin(PLAYER_MDNS)) {
      MDNS.addService("http", "tcp", 80);
      Serial.printf("[net] http://%s.local\n", PLAYER_MDNS);
    }
  } else {
    Serial.println("[net] sin WiFi -> sigue sonando local (independiente)");
  }

  // 3) servidor (arranca aunque no haya WiFi; util al reconectar)
  setupRoutes();
  g_server.begin();
  Serial.println("[net] servidor web en :80");
}

void loop() {
  g_server.handleClient();
}

}  // namespace net
