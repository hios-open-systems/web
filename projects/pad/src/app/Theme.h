// ============================================================================
//  Theme.h - Paleta de colores (RGB565) compartida por la config y la UI.
//  Valores compatibles con TFT_eSPI (mismo formato 16-bit).
// ============================================================================
#pragma once
#include <stdint.h>

namespace theme {
extern uint16_t BG;      // fondo
extern uint16_t PANEL;   // superficie base
extern uint16_t CARD;    // card elevada
extern uint16_t EDGE;    // borde suave
extern uint16_t FG;      // texto principal
extern uint16_t SOFT;    // texto secundario
extern uint16_t DIM;     // texto desactivado
extern uint16_t DARK;    // superficie hundida
constexpr uint16_t CYAN    = 0x07FF;
constexpr uint16_t MAGENTA = 0xF81F;
constexpr uint16_t GREEN   = 0x07E0;
constexpr uint16_t ORANGE  = 0xFD20;
constexpr uint16_t YELLOW  = 0xFFE0;
constexpr uint16_t BLUE    = 0x041F;
constexpr uint16_t RED     = 0xF800;
constexpr uint16_t PURPLE  = 0x8010;
constexpr uint16_t VIOLET  = 0xC81F;  // violeta vivo (capa RGB)
constexpr uint16_t ROSE    = 0xFB56;  // coral/rosa (capa Calls)

enum : uint8_t { MODE_DARK = 0, MODE_LIGHT = 1 };

void applyMode(uint8_t mode);
uint16_t accentByIndex(uint8_t index);
const char* accentName(uint8_t index);

inline uint16_t rgb(uint8_t r, uint8_t g, uint8_t b) {
  return ((r & 0xF8) << 8) | ((g & 0xFC) << 3) | (b >> 3);
}

inline uint16_t blend(uint16_t a, uint16_t b, uint8_t amount) {
  uint8_t ar = ((a >> 11) & 0x1F) << 3;
  uint8_t ag = ((a >> 5) & 0x3F) << 2;
  uint8_t ab = (a & 0x1F) << 3;
  uint8_t br = ((b >> 11) & 0x1F) << 3;
  uint8_t bg = ((b >> 5) & 0x3F) << 2;
  uint8_t bb = (b & 0x1F) << 3;
  uint8_t r = ar + ((int16_t)(br - ar) * amount) / 255;
  uint8_t g = ag + ((int16_t)(bg - ag) * amount) / 255;
  uint8_t c = ab + ((int16_t)(bb - ab) * amount) / 255;
  return rgb(r, g, c);
}
}  // namespace theme
