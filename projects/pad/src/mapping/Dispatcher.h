// ============================================================================
//  Dispatcher - Recibe InputEvents, resuelve la Action via KeyMap (capa activa)
//  y la encola. Casos especiales que se manejan ACA:
//    - STICK_SW: gestos (tap=click izq / doble=click der / largo=toggle mouse).
//    - ENC_SW: NAVEGACION (tap abre el menu; NO dispara acciones de la capa).
//    - LAYER / MOUSE_TOGGLE: cambian estado local.
//  Ademas actualiza el StateManager (estado optimista) segun el binding.
// ============================================================================
#pragma once
#include "../app/Types.h"
#include "KeyMap.h"

class StateManager;

class Dispatcher {
public:
  void begin(KeyMap* km) { m_km = km; }
  void setState(StateManager* s) { m_state = s; }
  void dispatch(const InputEvent& e);
  void tick(uint32_t now);             // cierra el tap simple del stick

  uint8_t activeLayer() const { return m_activeLayer; }
  void    setLayer(uint8_t n);
  bool    mouseOn() const { return m_mouseOn; }

private:
  void applyLayer(const LayerAction& la);
  void handleStickSw(const InputEvent& e);
  void handleEncSwNav(const InputEvent& e);   // encoder = navegacion (abre menu)
  void enqueueClick(uint8_t button);

  KeyMap*       m_km = nullptr;
  StateManager* m_state = nullptr;
  uint8_t       m_activeLayer = 0;
  bool          m_mouseOn = false;

  // Gestos del SW del stick
  bool     m_stickLongDone = false;
  bool     m_tapPending = false;
  uint32_t m_tapMs = 0;

  // Navegacion del SW del encoder
  bool     m_encLong = false;
};
