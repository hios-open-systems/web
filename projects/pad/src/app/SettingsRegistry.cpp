#include "SettingsRegistry.h"

namespace settings {

// El ORDEN reproduce el layout historico de las secciones de ajustes:
//   Apariencia -> Brillo, Tema, Color
//   Sistema    -> Hora, WiFi, Calibrar, Precision, Dimmer
// Recorrer la tabla filtrando por grupo da exactamente esa secuencia.
static const Desc TABLE[] = {
  { BRIGHT, APPEARANCE, "Brillo",    "sun"     },
  { THEME,  APPEARANCE, "Tema",      "moon"    },
  { ACCENT, APPEARANCE, "Color",     "palette" },
  { CLOCK,  SYSTEM,     "Hora",      "clock"   },
  { WIFI,   SYSTEM,     "WiFi",      "wifi"    },
  { CAL,    SYSTEM,     "Calibrar",  "target"  },
  { PREC,   SYSTEM,     "Precision", "gauge"   },
  { DIM,    SYSTEM,     "Dimmer",    "timer"   },
};

int         count()      { return (int)(sizeof(TABLE) / sizeof(TABLE[0])); }
const Desc& at(int i)    { return TABLE[(i < 0 || i >= count()) ? 0 : i]; }

}  // namespace settings
