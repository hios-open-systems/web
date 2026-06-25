#include "AnalogStick.h"
#include <Arduino.h>
#include "../app/Pins.h"
#include "../app/Config.h"
#include "../app/AppState.h"

int AnalogStick::sampleAvg(uint8_t pin) const {
  // Al cambiar de canal ADC, el sample-and-hold retiene carga del canal anterior
  // y contamina las lecturas (crosstalk -> ejes diagonales). VARIAS lecturas de
  // descarte con settling dejan que el S/H se cargue al valor REAL de este canal
  // (la del potenciometro, ~10k, es lenta) antes de medir.
  for (uint8_t i = 0; i < cfg::STICK_SETTLE_READS; i++) {
    (void)analogRead(pin);
    delayMicroseconds(cfg::STICK_SETTLE_US);
  }
  uint32_t s = 0;
  for (uint8_t i = 0; i < cfg::STICK_SAMPLES; i++) s += analogRead(pin);
  return s / cfg::STICK_SAMPLES;
}

void AnalogStick::begin() {
  analogReadResolution(12);            // 0..4095
  analogSetAttenuation(ADC_11db);      // rango ~0..3.3V

  // Calibra el centro asumiendo el stick en reposo al arrancar (promedia varias
  // lecturas). El centro NO es 2048 en estos sticks, por eso se mide.
  uint32_t sx = 0, sy = 0;
  for (uint8_t i = 0; i < 16; i++) {
    sx += sampleAvg(pins::STICK_X);   // con settling anti-crosstalk
    sy += sampleAvg(pins::STICK_Y);
    delay(2);
  }
  m_centerX = sx / 16;
  m_centerY = sy / 16;
  m_fx = m_centerX;  m_fy = m_centerY;
  m_x  = m_centerX;  m_y  = m_centerY;
}

// Normaliza un eje crudo a -127..127 con zona muerta alrededor del centro.
static int16_t normAxis(int raw, int center) {
  int d = raw - center;
  if (abs(d) < cfg::STICK_DEADZONE) return 0;
  // descuenta la zona muerta para que el arranque sea suave
  d += (d > 0) ? -cfg::STICK_DEADZONE : cfg::STICK_DEADZONE;
  long n = (long)d * 127 / (cfg::STICK_HALFRANGE - cfg::STICK_DEADZONE);
  if (n > 127) n = 127;
  if (n < -127) n = -127;
  return (int16_t)n;
}

void AnalogStick::update(uint32_t now, InputSink& sink) {
  // Promedio + filtro EMA entero (m += (raw-m)/4). El truncado entero hace que
  // el ruido chico no mueva el valor -> estable en reposo.
  m_fx += (sampleAvg(pins::STICK_X) - m_fx) / 4;
  m_fy += (sampleAvg(pins::STICK_Y) - m_fy) / 4;
  m_x = (uint16_t)m_fx;   // filtrados, para el display
  m_y = (uint16_t)m_fy;

  // Centro de referencia segun el path (calibrado o centro de boot).
  int refX = appstate::stickCal.valid ? (int)appstate::stickCal.x.center : (int)m_centerX;
  int refY = appstate::stickCal.valid ? (int)appstate::stickCal.y.center : (int)m_centerY;

  // Auto-recentrado: el reposo REAL del stick rara vez cae exacto en el centro de
  // referencia (offset por ADC/temperatura/mecanica). m_drift lleva la lectura al marco
  // de la referencia para que el reposo de SIEMPRE 0 -> sin drift del puntero, con zona
  // muerta chica. El snap inicial espera a que el EMA se asiente (warmup): si snapeas en
  // el primer sample, m_f* todavia vale el centro de boot y el reposo EMA lo supera mas
  // rapido de lo que el seguimiento lento puede alcanzar -> el gate de banda se cierra y
  // el drift queda clavado. Tras el snap, seguimiento lento +-1 dentro de una banda (drift
  // termico). Fuera de la banda = empuje real -> no adapta, no roba movimiento intencional.
  if (!m_driftInit) {
    if (++m_driftWarmup >= cfg::STICK_RECENTER_WARMUP) {
      m_driftX = m_fx - refX; m_driftY = m_fy - refY; m_driftInit = true;
    }
  } else if (now - m_tRecenter >= cfg::STICK_RECENTER_MS) {
    m_tRecenter = now;
    if (abs((int)(m_fx - m_driftX) - refX) < cfg::STICK_REST_BAND) {
      int o = (int)(m_fx - refX) - m_driftX; m_driftX += (o > 0) - (o < 0);
    }
    if (abs((int)(m_fy - m_driftY) - refY) < cfg::STICK_REST_BAND) {
      int o = (int)(m_fy - refY) - m_driftY; m_driftY += (o > 0) - (o < 0);
    }
  }

  // Con calibracion: escala asimetrica por direccion. Sin ella: fallback al
  // centro de boot con rango simetrico (sigue usable hasta que calibres).
  int16_t nx, ny;
  if (appstate::stickCal.valid) {
    nx = normAxisCal(m_fx - m_driftX, appstate::stickCal.x);
    ny = normAxisCal(m_fy - m_driftY, appstate::stickCal.y);
  } else {
    nx = normAxis(m_fx - m_driftX, m_centerX);
    ny = normAxis(m_fy - m_driftY, m_centerY);
  }
  // Nivel de precision del stick (1..7, 4=default): escala la sensibilidad en pasos de
  // 20% (nivel 1=40% ... nivel 7=160%). Es una pre-escala del valor antes del HID.
  int lvl = appstate::prefs.stickPrecision; if (lvl < 1 || lvl > 7) lvl = 4;
  if (lvl != 4) {
    int pp = 40 + (lvl - 1) * 20;
    nx = (int16_t)((long)nx * pp / 100);
    ny = (int16_t)((long)ny * pp / 100);
    if (nx >  127) nx =  127; else if (nx < -127) nx = -127;
    if (ny >  127) ny =  127; else if (ny < -127) ny = -127;
  }

  bool active = (nx != 0 || ny != 0);

#ifdef STICK_DEBUG
  static uint32_t dbg = 0;
  if (now - dbg > 250) {
    dbg = now;
    Serial.printf("[stick] fx=%4ld fy=%4ld  cx=%u cy=%u  nx=%4d ny=%4d\n",
                  (long)m_fx, (long)m_fy, m_centerX, m_centerY, nx, ny);
  }
#endif

  if (active) {
    if (now - m_tLast >= cfg::STICK_MOUSE_MS) {
      m_tLast = now;
      sink.emit({InputId::STICK_AXIS, Edge::MOVE, nx, ny, now});
    }
    m_wasActive = true;
  } else if (m_wasActive) {
    // transicion a centrado: un MOVE en cero para frenar el mouse
    m_wasActive = false;
    sink.emit({InputId::STICK_AXIS, Edge::MOVE, 0, 0, now});
  }
}
