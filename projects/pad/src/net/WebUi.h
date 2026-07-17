// ============================================================================
//  WebUi - La PWA de control que sirve el PROPIO pad (no el companion).
//  Pagina self-contained (HTML+CSS+JS inline) + manifest, ambos en PROGMEM.
//  Consume el contrato que ya existe: GET /api/config (capas) + GET /api/ui
//  (mirror live) + POST /api/cmd (control). Sin PC de por medio.
// ============================================================================
#pragma once
#include <pgmspace.h>

namespace webui {
extern const char PAGE[]     PROGMEM;   // el control-panel (text/html)
extern const char MANIFEST[] PROGMEM;   // web app manifest (add-to-home-screen)
}  // namespace webui
