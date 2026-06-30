// ============================================================================
//  UiMirror.cpp - ver UiMirror.h.
// ============================================================================
#include "UiMirror.h"
#include "../app/Types.h"
#include "../mapping/KeyMap.h"

namespace mirror {

void serializeUi(JsonObject ui, const UiSnapshot& s, const KeyMap* km, bool includeLayer) {
  // --- estado live (cada frame); claves cortas para mantener el blob chico ---
  ui["b"]    = s.buttons;       // bitmask de pulsadores
  ui["lay"]  = s.activeLayer;
  ui["enc"]  = s.encPos;
  ui["sx"]   = s.stickX;
  ui["sy"]   = s.stickY;
  ui["mo"]   = s.mouseOn;
  ui["cf"]   = s.clickFlash;
  ui["em"]   = s.encMode;
  ui["alt"]  = s.altActive;     // 0=ninguno, 1=ALT1, 2=ALT2 (held+linger)
  ui["mic"]  = s.micMuted;
  ui["cam"]  = s.camOff;
  ui["med"]  = s.mediaPlay;
  ui["vol"]  = s.volume;
  ui["tp"]   = s.transports;
  ui["wOff"] = s.wifiOff;
  ui["bat"]  = s.battery;
  ui["live"] = s.live;
  // monitor escalares (baratos; los arrays/hist se omiten en v1)
  ui["cpuT"] = s.cpuTemp;
  ui["gpuT"] = s.gpuTemp;
  ui["cpuL"] = s.cpuLoad;
  ui["gpuL"] = s.gpuLoad;
  // WiZ
  ui["wOn"]   = s.wizOn;
  ui["wBr"]   = s.wizBright;
  ui["wRoom"] = s.wizRoom;
  ui["wTgt"]  = s.wizTarget;

  // --- descriptor de capa (solo cuando cambia o lo piden con uiFull) ---
  if (includeLayer && km) {
    const Layer& L = km->layer(s.activeLayer);
    JsonObject lo = ui["layer"].to<JsonObject>();
    lo["i"]     = s.activeLayer;
    lo["n"]     = L.name;
    lo["color"] = L.color;            // RGB565; el companion lo expande a #rrggbb
    lo["group"] = (uint8_t)L.group;
    lo["count"] = km->count();
    JsonArray labels = lo["labels"].to<JsonArray>();
    for (int i = 0; i < (int)InputId::_COUNT; i++) labels.add(L.bindings[i].label);
  }
}

}  // namespace mirror
