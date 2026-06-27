#include "MacroEngine.h"
#include <Arduino.h>
#include "../storage/DefaultConfig.h"

void MacroEngine::run(uint16_t id, ITransport& t) {
  uint8_t n = 0;
  const MacroStep* steps = macroSteps(id, n);
  if (!steps) return;
  for (uint8_t i = 0; i < n; i++) {
    const MacroStep& s = steps[i];
    if (s.kind == MacroStep::TEXT)  { t.sendText(textById(s.arg)); continue; }
    if (s.kind == MacroStep::DELAY) { delay(s.arg);                continue; }
    // KEY/MEDIA/MOUSE: despacha por el TIPO de la accion, no por kind. Asi una macro
    // con variantes per-OS (que el companion resolvio) ejecuta el payload correcto
    // aunque el OS resuelto cambie el tipo de accion del paso.
    if (s.action.type == ActionType::KEY)        t.sendKey(s.action.p.key);
    else if (s.action.type == ActionType::MEDIA) t.sendMedia(s.action.p.media);
    else if (s.action.type == ActionType::MOUSE) t.sendMouse(s.action.p.mouse);
  }
}
