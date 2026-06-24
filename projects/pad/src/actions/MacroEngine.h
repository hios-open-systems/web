// ============================================================================
//  MacroEngine - Ejecuta una secuencia (macro): teclas/media/mouse/texto/delays.
//  Corre sincrono en el transportTask, asi los delays no frenan el sampleo de
//  entrada (que vive en otra task). Las macros y los textos los provee
//  DefaultConfig (en M3 vendran del JSON).
// ============================================================================
#pragma once
#include "../transport/ITransport.h"

struct MacroStep {
  enum Kind : uint8_t { KEY, MEDIA, MOUSE, TEXT, DELAY } kind;
  Action   action;   // para KEY / MEDIA / MOUSE
  uint16_t arg;      // DELAY: ms ; TEXT: id en la tabla de textos
};

class MacroEngine {
public:
  void run(uint16_t id, ITransport& t);
};
