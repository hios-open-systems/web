#include "ButtonMatrix.h"
#include <Arduino.h>
#include "../app/Pins.h"
#include "../app/Config.h"

void ButtonMatrix::begin() {
  // Orden = InputId: 0..9 = BTN_1..10, 10..11 = ALT_1/2, 12 = enc SW, 13 = stick SW.
  // Asi el indice del ButtonMatrix (= bit del bitmask) coincide con el valor de InputId.
  const uint8_t pinsArr[N] = {
    pins::BOTON[0], pins::BOTON[1], pins::BOTON[2], pins::BOTON[3], pins::BOTON[4],
    pins::BOTON[5], pins::BOTON[6], pins::BOTON[7], pins::BOTON[8], pins::BOTON[9],
    pins::BOTON[10], pins::BOTON[11],
    pins::ENC_SW, pins::STICK_SW};
  const InputId ids[N] = {
    InputId::BTN_1, InputId::BTN_2, InputId::BTN_3, InputId::BTN_4, InputId::BTN_5,
    InputId::BTN_6, InputId::BTN_7, InputId::BTN_8, InputId::BTN_9, InputId::BTN_10,
    InputId::ALT_1, InputId::ALT_2,
    InputId::ENC_SW, InputId::STICK_SW};

  for (uint8_t i = 0; i < N; i++) {
    m_btn[i] = {pinsArr[i], ids[i], false, false, false, 0, 0};
    pinMode(pinsArr[i], INPUT_PULLUP);
  }
}

void ButtonMatrix::seedInitialState() {
  // Siembra el estado con la lectura real para no disparar PRESS fantasma
  // (los pines pueden leer indeterminado durante el reset).
  for (uint8_t i = 0; i < N; i++) {
    bool pulsado = (digitalRead(m_btn[i].pin) == LOW);
    m_btn[i].estable     = pulsado;
    m_btn[i].lecturaPrev = pulsado;
  }
}

void ButtonMatrix::update(uint32_t now, InputSink& sink) {
  for (uint8_t i = 0; i < N; i++) {
    Boton& b = m_btn[i];
    bool crudo = (digitalRead(b.pin) == LOW);  // activo en bajo

    if (crudo != b.lecturaPrev) {              // cambio en lectura cruda
      b.lecturaPrev = crudo;
      b.tCambio = now;                         // reinicia ventana de debounce
    }

    if ((now - b.tCambio) >= cfg::DEBOUNCE_MS && crudo != b.estable) {
      b.estable = crudo;                       // cambio sostenido: es real
      if (crudo) {
        b.tPress = now;
        b.longEmitido = false;
        sink.emit({b.id, Edge::PRESS, 0, 0, now});
      } else {
        sink.emit({b.id, Edge::RELEASE, 0, 0, now});
      }
    }

    // Long-press: una sola emision mientras se mantiene pulsado.
    if (b.estable && !b.longEmitido && (now - b.tPress) >= cfg::LONGPRESS_MS) {
      b.longEmitido = true;
      sink.emit({b.id, Edge::LONG_PRESS, 0, 0, now});
    }
  }
}
