// ============================================================================
//  ConfigStore.cpp - ver ConfigStore.h. Persistencia en LittleFS (particion
//  "spiffs" de default_8MB.csv, sin cambiar la tabla).
// ============================================================================
#include "ConfigStore.h"
#include <LittleFS.h>

namespace cfgstore {

static bool        s_ok   = false;
static const char* PATH   = "/config.json";

void begin() {
  s_ok = LittleFS.begin(true);   // formatOnFail=true: formatea la 1ra vez si hace falta
  if (!s_ok) Serial.println("[cfg] LittleFS no monto -> sin persistencia (defaults compilados)");
}

bool load(String& out) {
  if (!s_ok || !LittleFS.exists(PATH)) return false;
  File f = LittleFS.open(PATH, "r");
  if (!f) return false;
  out = f.readString();
  f.close();
  return out.length() > 0;
}

bool save(const char* json, size_t len) {
  if (!s_ok) return false;
  File f = LittleFS.open(PATH, "w");
  if (!f) return false;
  size_t w = f.write((const uint8_t*)json, len);
  f.close();
  return w == len;
}

void remove() {
  if (s_ok) LittleFS.remove(PATH);
}

}  // namespace cfgstore
