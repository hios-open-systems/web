// ============================================================================
//  StatusPanel - Panel de estado lateral (derecha) como TFT_eSprite 8-bit.
//  Muestra estado optimista: Mic / Mouse / Media / Volumen / Capa / transporte.
//  Dirty-check: solo re-renderiza y hace pushSprite cuando cambia algo.
// ============================================================================
#pragma once
#include <TFT_eSPI.h>
#include "../app/Types.h"

namespace statuspanel {
void begin(TFT_eSPI& tft);                              // crea el sprite una vez
void render(TFT_eSPI& tft, const UiSnapshot& s, uint8_t layerCount);
void forceRedraw();                                     // forzar (al volver del menu)
}  // namespace statuspanel
