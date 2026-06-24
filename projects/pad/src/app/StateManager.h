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

class StateManager {
public:
  void applyToggle(StateToggle t);     // flip de mic/media/camara
  void setMouse(bool on)   { m_s.mouseOn = on; }
  void bumpVolume(int d);              // clamp 0..100
  void setVolume(uint8_t v) { m_s.volume = v > 100 ? 100 : v; }

  const OptState& get() const { return m_s; }

private:
  OptState m_s;
};
