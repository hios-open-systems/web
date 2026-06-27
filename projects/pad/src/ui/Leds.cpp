// ============================================================================
//  Leds.cpp - ver Leds.h.
// ============================================================================
#include "Leds.h"
#include "../app/Config.h"
#include <Adafruit_NeoPixel.h>

namespace leds {

static Adafruit_NeoPixel s_strip(cfg::NEOPIXEL_COUNT, cfg::NEOPIXEL_PIN, NEO_GRB + NEO_KHZ800);
static bool     s_ready  = false;
static uint16_t s_lastCol = 0;                    // ultimo color (RGB565)
static bool     s_off     = true;                 // apagada a proposito (estado inicial)
static uint8_t  s_bright  = cfg::NEOPIXEL_BRIGHT; // brillo global (dimming)

// RGB565 -> componentes 8 bit (escala completa 0..255).
static inline void unpack565(uint16_t c, uint8_t& r, uint8_t& g, uint8_t& b) {
  uint8_t r5 = (c >> 11) & 0x1F, g6 = (c >> 5) & 0x3F, b5 = c & 0x1F;
  r = (uint8_t)((r5 * 255 + 15) / 31);
  g = (uint8_t)((g6 * 255 + 31) / 63);
  b = (uint8_t)((b5 * 255 + 15) / 31);
}

// Pinta la tira con el color/estado actuales al brillo actual.
static void render() {
  if (!s_ready) return;
  if (s_off || s_bright == 0) { s_strip.clear(); s_strip.show(); return; }   // apagada / dimmeada a 0
  uint8_t r, g, b; unpack565(s_lastCol, r, g, b);
  uint32_t col = Adafruit_NeoPixel::Color(r, g, b);
  for (uint16_t i = 0; i < cfg::NEOPIXEL_COUNT; i++) s_strip.setPixelColor(i, col);
  s_strip.show();
}

void begin() {
  if (!cfg::NEOPIXEL_ENABLED) return;
  s_strip.begin();
  s_strip.setBrightness(s_bright);
  s_strip.clear();
  s_strip.show();            // estado conocido = apagada (tapa el parpadeo del boot-log si lo hubiera)
  s_ready = true;
}

void setLayerColor(uint16_t rgb565) {
  if (!s_ready) return;
  if (!s_off && rgb565 == s_lastCol) return;   // sin cambios -> no re-emitir
  s_lastCol = rgb565; s_off = false;
  render();
}

void off() {
  if (!s_ready || s_off) return;
  s_off = true;
  render();
}

void setBrightness(uint8_t b) {
  if (!s_ready || b == s_bright) return;       // cachea: solo re-emite si cambia
  s_bright = b;
  s_strip.setBrightness(b);
  render();
}

}  // namespace leds
