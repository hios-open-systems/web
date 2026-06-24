// ============================================================================
//  ButtonMatrix - Los 7 pulsadores momentaneos (5 botones + SW encoder +
//  SW stick), todos INPUT_PULLUP / activos en bajo, con debounce y long-press.
//  Emite PRESS / RELEASE / LONG_PRESS como InputEvent.
// ============================================================================
#pragma once
#include "../app/Types.h"

class ButtonMatrix {
public:
  static constexpr uint8_t N = 7;  // 0..4 botones, 5 enc SW, 6 stick SW

  void begin();
  // Lee el estado inicial real (evita eventos fantasma al arrancar).
  void seedInitialState();
  void update(uint32_t now, InputSink& sink);

  bool pressed(uint8_t i) const { return i < N ? m_btn[i].estable : false; }

private:
  struct Boton {
    uint8_t pin;
    InputId id;
    bool     estable;      // estado estable: true = pulsado
    bool     lecturaPrev;  // ultima lectura cruda
    bool     longEmitido;  // ya se emitio LONG_PRESS en esta pulsacion
    uint32_t tCambio;      // millis del ultimo flanco crudo
    uint32_t tPress;       // millis del ultimo PRESS estable
  };
  Boton m_btn[N];
};
