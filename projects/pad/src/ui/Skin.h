// ============================================================================
//  Skin.h - Contexto de render + API del dashboard Cards.
//
//  Ya NO hay "sistema de skins" (un solo dashboard fijo: Cards). Las vistas de
//  Monitor son capas con su propio render (ver monitor.h). renderUI() en
//  main.cpp despacha: capa de monitor -> monitor::render; si no -> dash::*.
//
//  Dirty-check del dashboard:
//    full()    -> dibuja TODO (entrada / cambio de capa; repinta opaco).
//    keycap()  -> una tecla cambio -> redibuja SOLO esa tecla.
//    status()  -> mic/cam/media/vol/enlace -> redibuja SOLO ese area (dock).
//    clock()   -> cambio de minuto -> redibuja SOLO el reloj.
//    encStrip()/encDial()/stick() -> franja del encoder / dial / cursor.
// ============================================================================
#pragma once
#include <TFT_eSPI.h>
#include "../app/Types.h"

class KeyMap;

struct SkinContext {
  TFT_eSPI*   tft;
  KeyMap*     km;
  const char* clock;   // "HH:MM" ya formateado
};

namespace dash {
void full    (const SkinContext&, const UiSnapshot&);
void keycap  (const SkinContext&, const UiSnapshot&, uint8_t i, bool on);
void status  (const SkinContext&, const UiSnapshot&);
void clock   (const SkinContext&);
void encStrip(const SkinContext&, const UiSnapshot&);
void encDial (const SkinContext&, const UiSnapshot&);
void stick   (const SkinContext&, const UiSnapshot&);
}  // namespace dash
