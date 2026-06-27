// ============================================================================
//  UiMirror - Codifica el UiSnapshot (lo que dibuja la pantalla) a JSON para el
//  "espejo" del companion. Es el UNICO encoder del contrato del mirror:
//    - estado live (cada frame): campos que la pantalla dibuja.
//    - descriptor de capa (solo en cambio de capa o ?uiFull): nombre/color/labels
//      de la capa activa, derivado del KeyMap en RAM.
//  Ver projects/pad/companion/src/web (lado consumidor) y el plan del mirror.
// ============================================================================
#pragma once
#include <ArduinoJson.h>

struct UiSnapshot;   // app/Types.h
class  KeyMap;       // mapping/KeyMap.h

namespace mirror {

// Llena `ui` con el estado live; si includeLayer y km != nullptr, agrega el
// objeto `layer` (nombre/color/grupo/labels de la capa activa).
void serializeUi(JsonObject ui, const UiSnapshot& s, const KeyMap* km, bool includeLayer);

}  // namespace mirror
