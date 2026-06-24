#include "Theme.h"

namespace theme {

uint16_t BG    = 0x0000;
uint16_t PANEL = 0x1082;
uint16_t CARD  = 0x18E3;
uint16_t EDGE  = 0x39E7;
uint16_t FG    = 0xFFFF;
uint16_t SOFT  = 0xBDF7;
uint16_t DIM   = 0x7BEF;
uint16_t DARK  = 0x2104;

void applyMode(uint8_t mode) {
  if (mode == MODE_LIGHT) {
    BG    = 0xF7BE;
    PANEL = 0xFFFF;
    CARD  = 0xEF7D;
    EDGE  = 0xC618;
    FG    = 0x0841;
    SOFT  = 0x4208;
    DIM   = 0x8410;
    DARK  = 0xDEFB;
    return;
  }

  BG    = 0x0000;
  PANEL = 0x1082;
  CARD  = 0x18E3;
  EDGE  = 0x39E7;
  FG    = 0xFFFF;
  SOFT  = 0xBDF7;
  DIM   = 0x7BEF;
  DARK  = 0x2104;
}

uint16_t accentByIndex(uint8_t index) {
  static const uint16_t accents[] = { CYAN, GREEN, MAGENTA, ORANGE, VIOLET, ROSE, YELLOW };
  return accents[index % (sizeof(accents) / sizeof(accents[0]))];
}

const char* accentName(uint8_t index) {
  static const char* names[] = { "Cyan", "Green", "Magenta", "Orange", "Violet", "Rose", "Yellow" };
  return names[index % (sizeof(names) / sizeof(names[0]))];
}

}  // namespace theme
