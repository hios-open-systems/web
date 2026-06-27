// ============================================================================
//  monitor.h - Vistas de telemetria del companion (General/Red/Nucleos/Disco).
//  NO son "skins": son capas con render propio. renderUI() despacha aca cuando
//  la capa activa es una vista de monitor (ver viewFor()).
//
//  Render PARCIAL directo a la TFT: cada vista guarda su estado previo y solo
//  redibuja las celdas que cambiaron (clear localizado + draw), igual que los
//  partials del dashboard. Sin sprite full-screen -> no "refresca toda la
//  pantalla" y no bloquea el webserver (el pill "live" deja de grisarse).
// ============================================================================
#pragma once
#include <TFT_eSPI.h>
#include "../app/Types.h"

namespace monitor {

enum class View : uint8_t { GENERAL, RED, NUCLEOS, DISCO };

bool isLayer(const char* layerName);          // true si la capa es una vista de monitor
View viewFor(const char* layerName);          // GENERAL si no matchea

// full=true: repinta todo (entrada a la capa). full=false: diff parcial.
void render(TFT_eSPI& tft, const UiSnapshot& s, const char* clockStr, View v, bool full);

// Redibujo del reloj (cambio de minuto), sin tocar el resto.
void drawClock(TFT_eSPI& tft, const char* clockStr);

// Pre-carga del historial de throughput desde el companion (KB/s), SOLO si el
// buffer local esta vacio -> los sparklines de Red/Disco aparecen poblados la 1ra
// vez que se abre la vista, en vez de construirse de cero. Lo llama Net.cpp.
void seedNetHist(const uint16_t* down, const uint16_t* up, int n);
void seedDiskHist(const uint16_t* rd, const uint16_t* wr, int n);

}  // namespace monitor
