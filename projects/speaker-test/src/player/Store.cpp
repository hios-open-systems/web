#include "Store.h"
#include <Arduino.h>
#include <LittleFS.h>

namespace store {

namespace {
const char* PATH = "/song.json";
bool g_ready = false;
static char g_readbuf[songfmt::MAX_WIRE_BYTES + 1];
}  // namespace

void begin() {
  g_ready = LittleFS.begin(true);  // formatea si hace falta
  if (!g_ready) Serial.println("[store] LittleFS no monto");
}

bool save(const char* json, size_t len) {
  if (!g_ready || len == 0 || len > songfmt::MAX_WIRE_BYTES) return false;
  File f = LittleFS.open(PATH, "w");
  if (!f) return false;
  size_t w = f.write((const uint8_t*)json, len);
  f.close();
  return w == len;
}

bool loadInto(DeviceSong& out) {
  if (!g_ready || !LittleFS.exists(PATH)) return false;
  File f = LittleFS.open(PATH, "r");
  if (!f) return false;
  size_t len = f.size();
  if (len == 0 || len > songfmt::MAX_WIRE_BYTES) { f.close(); return false; }
  size_t r = f.readBytes(g_readbuf, len);
  f.close();
  g_readbuf[r] = '\0';
  return parseDeviceSong(g_readbuf, r, out).ok;
}

void clear() {
  if (g_ready) LittleFS.remove(PATH);
}

}  // namespace store
