// HIOS Speaker Test - Red: WiFi STA + servidor web (device)
// -----------------------------------------------------------------------------
// El ESP sirve su propia pagina HTTP (patron del pad). Por eso el envio funciona:
// la pagina la sirve el device por http, sin el bloqueo mixed-content de servir
// desde openhios.dev (https). WiFi es opcional: si no conecta, igual toca la
// cancion cargada (independencia).
// -----------------------------------------------------------------------------
#pragma once

namespace net {

void begin();  // carga cancion guardada-o-default, reproduce, luego WiFi + rutas
void loop();   // server.handleClient()

}  // namespace net
