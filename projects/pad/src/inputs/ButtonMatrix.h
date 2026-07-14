// ============================================================================
//  ButtonMatrix - Los 14 pulsadores del pad.  rev 0.9
//
//  Dos formas de leerlos, un solo antirrebote:
//    · 10 teclas de ACCION (BTN_1..BTN_10) en MATRIZ 2x5 con diodos. Se escanea
//      manejando una fila a LOW por vez y leyendo las 5 columnas.
//    · 4 DIRECTOS (ALT_1, ALT_2, SW del encoder, SW del stick): INPUT_PULLUP a
//      GND, se leen siempre.
//
//  El muestreo (`sample`) esta separado de la maquina de debounce/long-press a
//  proposito: como se LEE un boton cambio en rev 0.9, pero cuando un boton
//  cuenta como pulsado no cambio en nada. Mezclar las dos cosas era lo que hacia
//  que pasar a matriz pareciera un rewrite.
//
//  Emite PRESS / RELEASE / LONG_PRESS como InputEvent. La API publica (begin /
//  seedInitialState / update / pressed) es la misma que en rev 0.8: main.cpp no
//  se entera de que abajo hay una matriz.
// ============================================================================
#pragma once
#include "../app/Types.h"

class ButtonMatrix {
public:
  static constexpr uint8_t FILAS = 2;
  static constexpr uint8_t COLS  = 5;
  static constexpr uint8_t N_MTX = FILAS * COLS;  // 10 teclas de accion
  // El indice i (= bit del bitmask `buttons`) coincide con el valor de InputId:
  // 0..9 = BTN_1..BTN_10 (matriz), 10..11 = ALT_1/2, 12 = enc SW, 13 = stick SW.
  static constexpr uint8_t N = 14;

  void begin();
  // Lee el estado inicial real (evita eventos fantasma al arrancar).
  void seedInitialState();
  void update(uint32_t now, InputSink& sink);

  bool pressed(uint8_t i) const { return i < N ? m_btn[i].estable : false; }

private:
  // Un barrido completo: escanea la matriz y lee los directos. Deja en `crudo`
  // el estado fisico de los N botones (true = pulsado).
  void sample(bool* crudo) const;

  struct Boton {
    InputId  id;
    bool     estable;      // estado estable: true = pulsado
    bool     lecturaPrev;  // ultima lectura cruda
    bool     longEmitido;  // ya se emitio LONG_PRESS en esta pulsacion
    uint32_t tCambio;      // millis del ultimo flanco crudo
    uint32_t tPress;       // millis del ultimo PRESS estable
  };
  Boton m_btn[N];
};
