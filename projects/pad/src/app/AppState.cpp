#include "AppState.h"
#include "Theme.h"

namespace appstate {
volatile AppMode mode = AppMode::NORMAL;
StickCal         stickCal = {0, {0, 2048, 4095, 450}, {0, 2048, 4095, 450}, false};
uint8_t          brightness = 100;
UiPrefs          prefs;
volatile uint32_t lastInputMs = 0;

void resetPrefs() {
  prefs.magic = UI_PREFS_MAGIC;
  prefs.themeMode = theme::MODE_DARK;
  prefs.accentIndex = 0;
  prefs.brightness = 100;
  prefs.dimTimeout = 2;   // 30s
  prefs.skinIndex = 0;    // Cards
  prefs.clockMinute = 12 * 60;
  prefs.clockSetAtMs = 0;
  brightness = prefs.brightness;
}

uint16_t currentClockMinute(uint32_t nowMs) {
  uint32_t elapsedMin = (nowMs - prefs.clockSetAtMs) / 60000UL;
  return (prefs.clockMinute + elapsedMin) % (24 * 60);
}

uint16_t dimTimeoutSeconds() {
  static const uint16_t values[] = {0, 15, 30, 60, 120};
  uint8_t i = prefs.dimTimeout;
  if (i >= sizeof(values) / sizeof(values[0])) i = 2;
  return values[i];
}
}  // namespace appstate
