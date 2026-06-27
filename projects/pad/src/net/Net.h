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
#include "../actions/Action.h"   // CompanionCmd

struct RealState;          // definido en app/StateManager.h
class  KeyMap;             // definido en mapping/KeyMap.h

namespace net {
void begin();              // arranca STA (si hay creds); si no, queda OFFLINE (no portal)
void tick();               // servicia la maquina de estados (netTask)

void setKeyMap(const KeyMap* km);   // descriptor de capa para el blob de UI-mirror

void requestPortal();      // pide levantar el portal de config (re-registro explicito)
void openWifi();           // abrir WiFi desde el menu: reconecta/muestra estado; portal solo si no hay creds
void stopPortal();         // baja el portal/AP y vuelve a OFFLINE

void toggleWifi();         // prende/apaga el radio WiFi (lo atiende netTask). Ahorra energia.
bool isWifiEnabled();      // false si el usuario apago el WiFi

bool isConnected();        // STA conectado a la red
bool portalActive();       // modo portal de configuracion (AP)
bool timeSynced();         // NTP sincronizado al menos una vez

// Feedback real del companion (POST /api/state). hasFreshState() = llego algo
// reciente (< STATE_FRESH_MS); realState() = ultimo estado aceptado.
bool             hasFreshState(uint32_t nowMs);
const RealState& realState();

// Comandos pad->companion: el pad los encola y viajan en la respuesta al
// proximo POST /api/state; el companion los ejecuta (mute global, etc.).
void queueCommand(CompanionCmd cmd);

// Lanzar una app: el pad encola un appId que viaja en la respuesta al POST
// (res["launch"]); el companion lo mapea a un comando por OS y lo ejecuta.
void queueLaunch(uint16_t appId);

const char* ip();          // IP actual (STA o AP)
const char* apName();      // SSID del portal de config
const char* ssid();        // SSID de la red guardada/conectada (para la pantalla de estado)
}  // namespace net
