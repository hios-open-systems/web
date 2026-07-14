#include "ButtonMatrix.h"
#include <Arduino.h>
#include "../app/Pins.h"
#include "../app/Config.h"

void ButtonMatrix::begin() {
  // Filas: OUTPUT en reposo HIGH. Con las filas en alto, ninguna tecla puede
  // arrastrar su columna: el pullup de la columna gana y todo lee "suelto".
  for (uint8_t f = 0; f < FILAS; f++) {
    pinMode(pins::MTX_FILA[f], OUTPUT);
    digitalWrite(pins::MTX_FILA[f], HIGH);
  }
  // Columnas: INPUT_PULLUP. Una tecla cerrada las lleva a LOW contra su fila.
  for (uint8_t c = 0; c < COLS; c++) pinMode(pins::MTX_COL[c], INPUT_PULLUP);

  // Los 4 directos.
  pinMode(pins::ALT[0],   INPUT_PULLUP);
  pinMode(pins::ALT[1],   INPUT_PULLUP);
  pinMode(pins::ENC_SW,   INPUT_PULLUP);
  pinMode(pins::STICK_SW, INPUT_PULLUP);

  // El indice del array = el valor de InputId (ver Types.h).
  const InputId ids[N] = {
    InputId::BTN_1, InputId::BTN_2, InputId::BTN_3, InputId::BTN_4, InputId::BTN_5,
    InputId::BTN_6, InputId::BTN_7, InputId::BTN_8, InputId::BTN_9, InputId::BTN_10,
    InputId::ALT_1, InputId::ALT_2,
    InputId::ENC_SW, InputId::STICK_SW};

  for (uint8_t i = 0; i < N; i++) m_btn[i] = {ids[i], false, false, false, 0, 0};
}

void ButtonMatrix::sample(bool* crudo) const {
  // --- Matriz: una fila a LOW por vez -----------------------------------------
  // Si dos filas estuvieran en LOW a la vez, una columna en LOW no diria CUAL de
  // las dos teclas se apreto. Por eso se activa una sola y se vuelve a HIGH.
  for (uint8_t f = 0; f < FILAS; f++) {
    digitalWrite(pins::MTX_FILA[f], LOW);

    // El settle no es paranoia: la columna vuelve a HIGH por el pullup INTERNO
    // (~45k), que es debil. Sin esperar, una tecla de la fila anterior deja la
    // columna todavia baja y se lee como pulsada la de esta fila (fantasma).
    // Bajar a LOW es rapido (lo maneja la fila); subir es lo lento. Se espera lo lento.
    delayMicroseconds(cfg::MTX_SETTLE_US);

    for (uint8_t c = 0; c < COLS; c++) {
      crudo[f * COLS + c] = (digitalRead(pins::MTX_COL[c]) == LOW);  // activo en bajo
    }
    digitalWrite(pins::MTX_FILA[f], HIGH);
  }

  // --- Directos ---------------------------------------------------------------
  crudo[10] = (digitalRead(pins::ALT[0])   == LOW);
  crudo[11] = (digitalRead(pins::ALT[1])   == LOW);
  crudo[12] = (digitalRead(pins::ENC_SW)   == LOW);
  crudo[13] = (digitalRead(pins::STICK_SW) == LOW);
}

void ButtonMatrix::seedInitialState() {
  // Siembra el estado con la lectura real para no disparar PRESS fantasma
  // (los pines pueden leer indeterminado durante el reset).
  bool crudo[N];
  sample(crudo);
  for (uint8_t i = 0; i < N; i++) {
    m_btn[i].estable     = crudo[i];
    m_btn[i].lecturaPrev = crudo[i];
  }
}

void ButtonMatrix::update(uint32_t now, InputSink& sink) {
  // Un solo barrido por update: escanear la matriz dentro del lazo de debounce
  // la escanearia 10 veces por vuelta al pedo.
  bool crudo[N];
  sample(crudo);

  for (uint8_t i = 0; i < N; i++) {
    Boton& b = m_btn[i];

    if (crudo[i] != b.lecturaPrev) {           // cambio en lectura cruda
      b.lecturaPrev = crudo[i];
      b.tCambio = now;                         // reinicia ventana de debounce
    }

    if ((now - b.tCambio) >= cfg::DEBOUNCE_MS && crudo[i] != b.estable) {
      b.estable = crudo[i];                    // cambio sostenido: es real
      if (crudo[i]) {
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
