// ============================================================================
//  StickCalibration - Calibracion por eje del stick. El centro NO es 2048 y el
//  rango es ASIMETRICO (un lado llega mas lejos que el otro), por eso cada
//  direccion se escala independiente a +-127. Header-only (POD + math pura).
// ============================================================================
#pragma once
#include <stdint.h>
#include <stdlib.h>

struct AxisCal {
  uint16_t lo;      // crudo en el extremo "negativo"
  uint16_t center;  // crudo en reposo
  uint16_t hi;      // crudo en el extremo "positivo"
  uint16_t dead;    // zona muerta por eje (crudo)
};

struct StickCal {
  uint32_t magic;   // version/validez del layout
  AxisCal  x, y;
  bool     valid;
};

static constexpr uint32_t STICKCAL_MAGIC = 0xCA11B002;

// Normaliza un eje crudo a -127..127 con escala INDEPENDIENTE por direccion.
inline int16_t normAxisCal(int raw, const AxisCal& a) {
  int d = raw - (int)a.center;
  if (d > 0) {
    if (d <= (int)a.dead) return 0;
    long span = (long)a.hi - a.center - a.dead; if (span < 1) span = 1;
    long n = (long)(d - a.dead) * 127 / span;
    return (int16_t)(n > 127 ? 127 : n);
  } else if (d < 0) {
    int m = -d;
    if (m <= (int)a.dead) return 0;
    long span = (long)a.center - a.lo - a.dead; if (span < 1) span = 1;
    long n = (long)(m - a.dead) * 127 / span;
    return (int16_t)(-(n > 127 ? 127 : n));
  }
  return 0;
}
