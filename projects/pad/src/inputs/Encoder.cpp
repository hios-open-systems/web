#include "Encoder.h"
#include <Arduino.h>
#include "../app/Pins.h"

// Estado de cuadratura compartido con la ISR.
static volatile long    s_count = 0;   // cuenta cruda (4 por detente)
static volatile uint8_t s_state = 0;   // 2 bits previos en posiciones altas

// Tabla de transicion valida de cuadratura (indices invalidos -> 0).
static const int8_t ENC_TABLA[16] = {
    0, -1,  1,  0,
    1,  0,  0, -1,
   -1,  0,  0,  1,
    0,  1, -1,  0};

// ISR libre (el estado es file-scope, no necesita ser miembro).
static void IRAM_ATTR encoderISR() {
  uint8_t leido = (uint8_t)(digitalRead(pins::ENC_CLK) << 1) |
                  (uint8_t)digitalRead(pins::ENC_DT);
  s_state = ((s_state << 2) | leido) & 0x0F;
  s_count += ENC_TABLA[s_state];
}

void Encoder::begin() {
  pinMode(pins::ENC_CLK, INPUT_PULLUP);  // el KY-040 ya trae pull-ups
  pinMode(pins::ENC_DT,  INPUT_PULLUP);
  // Estado inicial para que el primer paso no de un salto falso.
  s_state = (uint8_t)(digitalRead(pins::ENC_CLK) << 1) |
            (uint8_t)digitalRead(pins::ENC_DT);
  attachInterrupt(digitalPinToInterrupt(pins::ENC_CLK), encoderISR, CHANGE);
  attachInterrupt(digitalPinToInterrupt(pins::ENC_DT),  encoderISR, CHANGE);
}

long Encoder::count() const {
  long c;
  noInterrupts();          // lectura atomica de la volatil
  c = s_count;
  interrupts();
  return c;
}

void Encoder::update(uint32_t now, InputSink& sink) {
  long raw = count();
  long detent = raw / 4;                 // 4 cuentas por click del KY-040
  long delta  = detent - m_lastReportedDetent;
  if (delta != 0) {
    m_lastReportedDetent = detent;
    sink.emit({InputId::ENC_ROT, Edge::ROTATE, (int16_t)delta, 0, now});
  }
}
