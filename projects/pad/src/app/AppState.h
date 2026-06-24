// ============================================================================
//  AppState - Estado global compartido entre tareas (modo de la app + la
//  calibracion viva del stick). El stick lo lee cada update; la rutina de
//  calibracion (uiTask) lo escribe mientras el inputTask esta pausado.
// ============================================================================
#pragma once
#include "../inputs/StickCalibration.h"

enum class AppMode : uint8_t { NORMAL, MENU, CALIBRATING, WIFI };

static constexpr uint32_t UI_PREFS_MAGIC = 0x50414432;  // PAD2

struct UiPrefs {
  uint32_t magic;
  uint8_t  themeMode;      // theme::MODE_*
  uint8_t  accentIndex;    // theme::accentByIndex()
  uint8_t  brightness;     // 10..100
  uint8_t  dimTimeout;     // index: off, 15s, 30s, 60s, 120s
  uint8_t  skinIndex;      // skin del dashboard (ver ui/Skin.h)
  uint16_t clockMinute;    // minutos desde 00:00
  uint32_t clockSetAtMs;   // millis() cuando se ajusto clockMinute
};

namespace appstate {
extern volatile AppMode mode;
extern StickCal         stickCal;
extern uint8_t          brightness;   // 0..100 (brillo del backlight, persiste en NVS)
extern UiPrefs          prefs;
extern volatile uint32_t lastInputMs;

void resetPrefs();
uint16_t currentClockMinute(uint32_t nowMs);
uint16_t dimTimeoutSeconds();
}  // namespace appstate
