// ============================================================================
//  AnalogStick - Stick tipo PlayStation en ADC1 (ejes X/Y). El pulsador lo
//  maneja ButtonMatrix (STICK_SW). Emite MOVE con los valores crudos (0..4095)
//  en v1/v2 cuando se mueve mas que un umbral o cada cierto periodo.
//  (La normalizacion/calibracion a -127..127 para mouse llega en M2.)
// ============================================================================
#pragma once
#include "../app/Types.h"

class AnalogStick {
public:
  void begin();
  void update(uint32_t now, InputSink& sink);

  uint16_t x() const { return m_x; }
  uint16_t y() const { return m_y; }

private:
  int32_t  m_fx = 2048, m_fy = 2048;  // valor FILTRADO (EMA) de cada eje
  uint16_t m_x = 2048, m_y = 2048;    // = filtrado, expuesto para display
  uint16_t m_centerX = 2048, m_centerY = 2048;  // centro calibrado al boot
  uint32_t m_tLast = 0;
  bool     m_wasActive = false;       // estaba desviado en el ciclo previo

  int32_t  m_driftX = 0, m_driftY = 0;  // offset de auto-recentrado: lleva el reposo real al centro de referencia
  bool     m_driftInit = false;         // snap inicial del drift hecho (mata el offset estatico al arrancar)
  uint16_t m_driftWarmup = 0;           // updates esperados antes del snap (deja asentar el EMA)
  uint32_t m_tRecenter = 0;             // ultimo paso de seguimiento lento

  int sampleAvg(uint8_t pin) const;   // promedio de STICK_SAMPLES lecturas
};
