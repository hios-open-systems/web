// ============================================================================
//  Menu - Menu navegable on-device, en DOS niveles.
//  Nivel 1: grupos (Trabajo / Multimedia / Web-Llamadas / Sistema), girando el
//           encoder; press = entrar.
//  Nivel 2: - grupos de capas -> "picker" de 5 botones: cada capa del grupo se
//             mapea a un boton fisico; apretarlo salta a esa capa.
//           - grupo Sistema -> carrusel de ajustes (RGB + Brillo/Tema/Color/
//             Skin/Dimmer/Hora/WiFi/Calibrar), navegado con el encoder.
//  Long-press del encoder = subir un nivel / cerrar. Timeout = cerrar.
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

void       turn(int delta);     // mover seleccion o editar valor
MenuResult press();             // entrar/elegir (ver MenuResult)
void       back();              // subir un nivel; en nivel 1 cierra (long-press)
uint8_t    selectedLayer();     // capa elegida cuando se devuelve SWITCH_LAYER

// Nivel 2 "picker": las capas del grupo estan mapeadas a los 5 botones.
bool       inLayerPicker();         // true si los botones fisicos eligen capa
MenuResult pickButton(uint8_t i);   // i=0..4 -> SWITCH_LAYER si hay capa ahi

void render(TFT_eSPI& tft);
}  // namespace menu
