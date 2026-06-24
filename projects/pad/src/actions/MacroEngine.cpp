#include "MacroEngine.h"
#include <Arduino.h>
#include "../storage/DefaultConfig.h"

void MacroEngine::run(uint16_t id, ITransport& t) {
  uint8_t n = 0;
  const MacroStep* steps = macroSteps(id, n);
  if (!steps) return;
  for (uint8_t i = 0; i < n; i++) {
    const MacroStep& s = steps[i];
    switch (s.kind) {
      case MacroStep::KEY:   t.sendKey(s.action.p.key);    break;
      case MacroStep::MEDIA: t.sendMedia(s.action.p.media); break;
      case MacroStep::MOUSE: t.sendMouse(s.action.p.mouse); break;
      case MacroStep::TEXT:  t.sendText(textById(s.arg));   break;
      case MacroStep::DELAY: delay(s.arg);                  break;
    }
  }
}
