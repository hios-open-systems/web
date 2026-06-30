// ============================================================================
//  SettingsRegistry - Fuente unica de los ajustes internos del pad (brillo,
//  tema, color, dimmer, hora, wifi, calibrar, precision). Antes vivian como
//  casos sueltos repartidos entre Menu/MenuModel; aca quedan como DATOS:
//  id estable + grupo + label + icono. El render y el menu los consultan en
//  vez de hardcodear nombres.
//
//  Los valores de `Id` coinciden 1:1 con menumodel::SettingId (mismo orden),
//  de modo que `Item.setting` sigue siendo el mismo entero que el menu espera.
// ============================================================================
#pragma once
#include <stdint.h>

namespace settings {

// MISMO orden/valor que menumodel::SettingId (S_BRIGHT..S_PREC).
enum Id : int8_t { BRIGHT, THEME, ACCENT, DIM, CLOCK, WIFI, CAL, PREC };

enum Group : uint8_t { APPEARANCE, SYSTEM };

struct Desc {
  Id          id;
  Group       group;
  const char* label;
  const char* icon;
};

int         count();
const Desc& at(int i);

}  // namespace settings
