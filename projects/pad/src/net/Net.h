// ============================================================================
//  Net (M1) - Conectividad WiFi + portal cautivo de configuracion + NTP.
//
//  Flujo:
//    begin()  -> si hay creds en NVS, conecta como STA; si no, levanta el portal.
//    tick()   -> maquina de estados (llamar seguido desde netTask):
//                  CONNECTING: espera conexion (o timeout -> portal)
//                  CONNECTED : servicia el WebServer + re-sincroniza NTP
//                  PORTAL    : AP + DNS cautivo + WebServer de config
//    Al sincronizar NTP, escribe la hora real en appstate (el reloj de la UI la
//    toma sola por el mecanismo de drift existente).
//
//  Solo librerias nativas del core ESP32 (WiFi/WebServer/DNSServer/ESPmDNS).
//  El portal NO dibuja en el TFT: expone portalActive()/apName()/ip() y el
//  uiTask se encarga de mostrar la pantalla de setup (un solo dueno del TFT).
// ============================================================================
#pragma once
#include <stdint.h>

namespace net {
void begin();              // arranca STA (si hay creds); si no, queda OFFLINE (no portal)
void tick();               // servicia la maquina de estados (netTask)

void requestPortal();      // pide levantar el portal de config (lo atiende netTask)
void stopPortal();         // baja el portal/AP y vuelve a OFFLINE

bool isConnected();        // STA conectado a la red
bool portalActive();       // modo portal de configuracion (AP)
bool timeSynced();         // NTP sincronizado al menos una vez

const char* ip();          // IP actual (STA o AP)
const char* apName();      // SSID del portal de config
}  // namespace net
