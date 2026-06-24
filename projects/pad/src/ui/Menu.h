// ============================================================================
//  Menu - Menu navegable on-device, manejado SOLO con el encoder.
//  Abrir: press del encoder (desde el dashboard). Girar = mover seleccion /
//  editar valor. Press = elegir/entrar. Long-press o timeout = cerrar.
//  Superficie compacta tipo settings: [capas...] + Brillo + Tema + Color +
//  Dimmer + Hora + Calibrar. El caller actua segun el resultado.
// ============================================================================
#pragma once
#include <TFT_eSPI.h>
#include "../mapping/KeyMap.h"

enum class MenuResult : uint8_t { NONE, SWITCH_LAYER, CALIBRATE, WIFI_SETUP };

namespace menu {
void init(KeyMap* km);
void open(uint8_t currentLayer);
void close();
bool isOpen();

void       turn(int delta);     // mover seleccion o editar brillo
MenuResult press();             // elegir/entrar (ver MenuResult)
void       back();              // cerrar (long-press)
uint8_t    selectedLayer();     // capa elegida cuando press()==SWITCH_LAYER

void render(TFT_eSPI& tft);
}  // namespace menu
