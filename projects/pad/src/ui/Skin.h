// ============================================================================
//  Skin.h - Sistema de skins del dashboard. Un skin define COMO se muestra la
//  misma info (capa, teclas, encoder, estado, reloj). Todos componen los mismos
//  IconKit/UiKit; cambian el layout.
//
//  Agregar un skin nuevo = escribir sus funciones en Skins.cpp y sumarlo al
//  array SKINS. Nada mas. El framework (renderUI) ya sabe usarlo.
//
//  Render eficiente sin parpadeo:
//    full()   -> dibuja TODO. El framework limpia la pantalla antes solo en
//                cambios de capa/skin; en otros casos full() repinta opaco.
//    keycap() -> una tecla cambio de estado -> redibuja SOLO esa tecla.
//    status() -> cambio mic/cam/media/vol/enlace -> redibuja SOLO ese area.
//    stick()  -> (opcional, puede ser nullptr) cursor del mouse en vivo.
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

struct Skin {
  const char* name;
  void (*full)  (const SkinContext&, const UiSnapshot&);
  void (*keycap)(const SkinContext&, const UiSnapshot&, uint8_t i, bool on);
  void (*status)(const SkinContext&, const UiSnapshot&);
  void (*stick) (const SkinContext&, const UiSnapshot&);  // puede ser nullptr
  void (*clock) (const SkinContext&);                     // redibuja SOLO el reloj (nullptr -> full)
  void (*encoder)(const SkinContext&, const UiSnapshot&); // redibuja la franja del encoder (mouse/stick); nullptr -> full
};

namespace skins {
uint8_t      count();
const Skin&  get(uint8_t i);
const char*  name(uint8_t i);
}  // namespace skins
