// ============================================================================
//  StateManager - Estado OPTIMISTA del dispositivo. El HID es a ciegas (no
//  sabemos el estado real de la PC), asi que recordamos lo que MANDAMOS:
//  mic muteado, modo mouse, play/pausa, camara, y un estimado de volumen.
//  El Dispatcher lo muta; el inputTask lo copia al UiSnapshot para la UI.
// ============================================================================
#pragma once
#include "Types.h"

struct OptState {
  bool    micMuted   = false;
  bool    mouseOn    = false;
  bool    mediaPlay  = true;
  bool    camOff     = false;
  uint8_t volume     = 50;    // 0..100
  uint8_t brightness = 100;   // 0..100 (para futuro WiZ/backlight)
};

// Estado REAL reportado por el companion (PC) via POST /api/state (Fase 1).
// Cuando llega fresco, pisa al optimista en la UI; si se queda viejo (> STATE_FRESH_MS)
// se vuelve al optimista. El pad sigue 100% usable sin companion (local-first).
struct RealState {
  bool     micMuted    = false;
  bool     camOff      = false;
  bool     mediaPlay   = true;
  uint8_t  volume      = 0;       // 0..100
  int16_t  cpuTemp     = -1000;   // C, -1000 = sin dato
  int16_t  gpuTemp     = -1000;
  uint8_t  cpuLoad     = 255;     // 0..100, 255 = sin dato
  uint8_t  gpuLoad     = 255;
  // --- monitor extendido (capas General/Red/Nucleos); sentinela = sin dato ---
  int16_t  cpuFan      = -1;      // RPM, -1 = sin dato
  uint8_t  gpuFan      = 255;     // 0..100, 255 = sin dato
  uint8_t  ram         = 255;     // 0..100, 255 = sin dato
  uint32_t netDown     = 0xFFFFFFFF;  // KB/s, 0xFFFFFFFF = sin dato
  uint32_t netUp       = 0xFFFFFFFF;
  char     ip[16]      = {0};     // IP local
  uint8_t  cores[24]   = {0};     // carga por nucleo 0..100
  uint8_t  coreCount   = 0;       // nucleos validos (0 = sin dato)
  // --- feedback WiZ (lo manda el companion para que la capa WiZ muestre que controla) ---
  char     wizRoom[16] = {0};     // cuarto activo
  char     wizTarget[16] = {0};   // "Todas" o el nombre de la luz
  bool     wizOn       = false;
  uint8_t  wizBright   = 0;       // 0..100
  uint32_t updatedAtMs = 0;       // millis() del ultimo POST aceptado (0 = nunca)
};

class StateManager {
public:
  void applyToggle(StateToggle t);     // flip de mic/media/camara
  void setMouse(bool on)   { m_s.mouseOn = on; }
  void bumpVolume(int d);              // clamp 0..100
  void setVolume(uint8_t v) { m_s.volume = v > 100 ? 100 : v; }

  // Re-ancla el optimista al ultimo real conocido: si el companion se cae, el
  // fallback arranca del ultimo valor bueno en vez de un estimado viejo.
  void syncFrom(const RealState& r) {
    m_s.micMuted = r.micMuted; m_s.camOff = r.camOff;
    m_s.mediaPlay = r.mediaPlay; m_s.volume = r.volume;
  }

  const OptState& get() const { return m_s; }

private:
  OptState m_s;
};
