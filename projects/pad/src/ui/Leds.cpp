// ============================================================================
//  Leds.cpp - ver Leds.h.
// ============================================================================
#include "Leds.h"
#include "../app/Config.h"
#include <Adafruit_NeoPixel.h>

namespace leds {

static_assert(cfg::NEOPIXEL_ZONES >= 1, "NEOPIXEL_ZONES >= 1");
static_assert(cfg::NEOPIXEL_ZONES <= cfg::NEOPIXEL_COUNT, "mas zonas que LEDs: alguna quedaria vacia");

static Adafruit_NeoPixel s_strip(cfg::NEOPIXEL_COUNT, cfg::NEOPIXEL_PIN, NEO_GRB + NEO_KHZ800);
static bool     s_ready  = false;
static uint16_t s_col[cfg::NEOPIXEL_ZONES] = {};   // color por zona (RGB565)
static bool     s_off     = true;                 // apagada a proposito (estado inicial)
static uint8_t  s_bright  = cfg::NEOPIXEL_BRIGHT; // brillo global (dimming)

// RGB565 -> componentes 8 bit (escala completa 0..255).
static inline void unpack565(uint16_t c, uint8_t& r, uint8_t& g, uint8_t& b) {
  uint8_t r5 = (c >> 11) & 0x1F, g6 = (c >> 5) & 0x3F, b5 = c & 0x1F;
  r = (uint8_t)((r5 * 255 + 15) / 31);
  g = (uint8_t)((g6 * 255 + 31) / 63);
  b = (uint8_t)((b5 * 255 + 15) / 31);
}

// Limite de zona. Se calcula proporcional (no de a bloques fijos) para que un
// COUNT que no sea multiplo de ZONES reparta el resto en vez de dejar LEDs
// huerfanos al final: la ultima zona se queda con lo que sobra.
uint16_t zoneBegin(uint8_t zone) {
  if (zone > cfg::NEOPIXEL_ZONES) zone = cfg::NEOPIXEL_ZONES;
  return (uint16_t)((uint32_t)zone * cfg::NEOPIXEL_COUNT / cfg::NEOPIXEL_ZONES);
}
uint16_t zoneEnd(uint8_t zone) { return zoneBegin(zone + 1); }
uint8_t  zoneCount() { return cfg::NEOPIXEL_ZONES; }

// Pinta la tira con el color/estado actuales al brillo actual.
static void render() {
  if (!s_ready) return;
  if (s_off || s_bright == 0) { s_strip.clear(); s_strip.show(); return; }   // apagada / dimmeada a 0
  for (uint8_t z = 0; z < cfg::NEOPIXEL_ZONES; z++) {
    uint8_t r, g, b; unpack565(s_col[z], r, g, b);
    uint32_t col = Adafruit_NeoPixel::Color(r, g, b);
    for (uint16_t i = zoneBegin(z); i < zoneEnd(z); i++) s_strip.setPixelColor(i, col);
  }
  s_strip.show();   // una sola emision para toda la tira, pinte lo que pinte
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
  // Sin cambios = ya esta prendida Y las zonas YA estan todas de ese color. Ojo:
  // no alcanza con mirar una, porque setZoneColor() pudo dejarlas distintas y
  // entonces hay que re-emitir para volver a unificarlas.
  bool same = !s_off;
  for (uint8_t z = 0; same && z < cfg::NEOPIXEL_ZONES; z++) same = (s_col[z] == rgb565);
  if (same) return;
  for (uint8_t z = 0; z < cfg::NEOPIXEL_ZONES; z++) s_col[z] = rgb565;
  s_off = false;
  render();
}

void setZoneColor(uint8_t zone, uint16_t rgb565) {
  if (!s_ready || zone >= cfg::NEOPIXEL_ZONES) return;
  if (!s_off && s_col[zone] == rgb565) return;   // sin cambios -> no re-emitir
  s_col[zone] = rgb565; s_off = false;
  render();
}

void off() {
  if (!s_ready || s_off) return;
  s_off = true;
  // Ademas de apagar, olvida el color de cada zona: "apagada" tiene que significar
  // NEGRA. Si no, un setZoneColor() posterior prende la zona pedida y de paso
  // resucita a las otras con el color que tenian antes del off().
  // OJO: esto es del off() explicito, NO del dimmer: setBrightness(0) apaga pero
  // conserva s_col[] para poder volver al color al subir el brillo.
  for (uint8_t z = 0; z < cfg::NEOPIXEL_ZONES; z++) s_col[z] = 0;
  render();
}

void setBrightness(uint8_t b) {
  if (!s_ready || b == s_bright) return;       // cachea: solo re-emite si cambia
  s_bright = b;
  s_strip.setBrightness(b);
  render();
}

}  // namespace leds
