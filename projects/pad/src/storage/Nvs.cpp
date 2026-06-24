#include "Nvs.h"
#include <Preferences.h>

namespace nvs {

static Preferences prefs;

void begin() {
  prefs.begin("deck", false);   // RW
}

bool loadStickCal(StickCal& out) {
  size_t n = prefs.getBytes("stick", &out, sizeof(out));
  if (n != sizeof(out)) return false;
  if (out.magic != STICKCAL_MAGIC || !out.valid) return false;
  return true;
}

void saveStickCal(const StickCal& cal) {
  // putBytes solo reescribe si el valor cambio (Preferences hace read-compare).
  prefs.putBytes("stick", &cal, sizeof(cal));
}

uint8_t loadBrightness(uint8_t def) {
  return prefs.getUChar("bright", def);
}

void saveBrightness(uint8_t pct) {
  prefs.putUChar("bright", pct);
}

bool loadUiPrefs(UiPrefs& out) {
  size_t n = prefs.getBytes("ui", &out, sizeof(out));
  if (n != sizeof(out)) return false;
  return out.magic == UI_PREFS_MAGIC;
}

void saveUiPrefs(const UiPrefs& uiPrefs) {
  prefs.putBytes("ui", &uiPrefs, sizeof(uiPrefs));
}

bool loadWifi(char* ssid, size_t ssidLen, char* pass, size_t passLen) {
  String s = prefs.getString("wssid", "");
  if (s.length() == 0) return false;
  String p = prefs.getString("wpass", "");
  strncpy(ssid, s.c_str(), ssidLen - 1); ssid[ssidLen - 1] = '\0';
  strncpy(pass, p.c_str(), passLen - 1); pass[passLen - 1] = '\0';
  return true;
}

void saveWifi(const char* ssid, const char* pass) {
  prefs.putString("wssid", ssid);
  prefs.putString("wpass", pass ? pass : "");
}

}  // namespace nvs
