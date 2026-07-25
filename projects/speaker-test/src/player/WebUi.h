// HIOS Speaker Test - UI web servida por el device
// -----------------------------------------------------------------------------
// Pagina autocontenida (HTML+CSS+JS) + manifest, en PROGMEM. La sirve el ESP por
// http, asi no hay bloqueo mixed-content: pegas el codigo exportado del composer
// y suena en vivo.
// -----------------------------------------------------------------------------
#pragma once
#include <pgmspace.h>

namespace webui {
extern const char PAGE[] PROGMEM;
extern const char MANIFEST[] PROGMEM;
}  // namespace webui
