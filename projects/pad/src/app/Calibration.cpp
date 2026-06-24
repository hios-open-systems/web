#include "Calibration.h"
#include <Arduino.h>
#include "Pins.h"
#include "Theme.h"
#include "AppState.h"
#include "Config.h"
#include "../storage/Nvs.h"

// Lectura promediada de un eje con settling anti-crosstalk (igual criterio que
// AnalogStick): varias lecturas de descarte antes de medir, para que la cal no
// quede contaminada por la carga del canal anterior del ADC.
static int readAxis(uint8_t pin) {
  for (uint8_t i = 0; i < cfg::STICK_SETTLE_READS; i++) {
    (void)analogRead(pin);
    delayMicroseconds(cfg::STICK_SETTLE_US);
  }
  uint32_t s = 0;
  for (uint8_t i = 0; i < 8; i++) s += analogRead(pin);
  return s / 8;
}

static void title(TFT_eSPI& tft, const char* l1, const char* l2, uint16_t col) {
  tft.fillScreen(theme::BG);
  tft.setTextDatum(MC_DATUM);
  tft.setTextColor(theme::CYAN, theme::BG);
  tft.drawString("Calibracion del stick", 240, 40, 4);
  tft.setTextColor(col, theme::BG);
  tft.drawString(l1, 240, 150, 4);
  tft.setTextColor(theme::DIM, theme::BG);
  if (l2) tft.drawString(l2, 240, 200, 2);
}

void runStickCalibration(TFT_eSPI& tft) {
  // --- Fase 1: centro (stick en reposo) ---
  title(tft, "Solta el stick", "midiendo el centro...", theme::FG);
  for (int s = 3; s >= 1; s--) {
    tft.setTextDatum(MC_DATUM);
    tft.setTextColor(theme::YELLOW, theme::BG);
    tft.setTextPadding(60);
    tft.drawString(String(s), 240, 260, 6);
    vTaskDelay(pdMS_TO_TICKS(500));
  }
  tft.setTextPadding(0);
  uint32_t cx = 0, cy = 0;
  for (uint8_t i = 0; i < 16; i++) { cx += readAxis(pins::STICK_X); cy += readAxis(pins::STICK_Y); }
  int centerX = cx / 16, centerY = cy / 16;

  // --- Fase 2: barrido (girar en circulos) ---
  title(tft, "Gira en circulos", "lleva el stick a todos los extremos", theme::GREEN);
  int minX = centerX, maxX = centerX, minY = centerY, maxY = centerY;
  uint32_t t0 = millis();
  while (millis() - t0 < 5000) {
    int x = readAxis(pins::STICK_X), y = readAxis(pins::STICK_Y);
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
    // barra de progreso
    int w = (millis() - t0) * 440 / 5000;
    tft.fillRect(20, 285, w, 14, theme::GREEN);
    vTaskDelay(pdMS_TO_TICKS(8));
  }

  // --- Fase 3: calcular + guardar ---
  StickCal cal;
  cal.magic = STICKCAL_MAGIC;
  cal.valid = true;
  uint16_t deadX = max(40, (maxX - minX) / 40);
  uint16_t deadY = max(40, (maxY - minY) / 40);
  cal.x = {(uint16_t)minX, (uint16_t)centerX, (uint16_t)maxX, deadX};
  cal.y = {(uint16_t)minY, (uint16_t)centerY, (uint16_t)maxY, deadY};

  appstate::stickCal = cal;     // aplicar en vivo (lo lee AnalogStick)
  nvs::saveStickCal(cal);

  Serial.printf("[cal] X lo=%d c=%d hi=%d dz=%d | Y lo=%d c=%d hi=%d dz=%d\n",
                minX, centerX, maxX, deadX, minY, centerY, maxY, deadY);

  title(tft, "Guardado!", "calibracion lista", theme::GREEN);
  vTaskDelay(pdMS_TO_TICKS(1200));

  appstate::mode = AppMode::NORMAL;
}
