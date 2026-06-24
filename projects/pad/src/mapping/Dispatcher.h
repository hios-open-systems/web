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
  uint8_t encMode() const { return m_encOverride; }     // 0=capa, 1=Vol, 2=Scroll, 3=Zoom, 4=Pestanas
  uint8_t longFlashMask(uint32_t now) const;            // bits de botones en ventana de flash de confirmacion

private:
  void applyLayer(const LayerAction& la);
  void handleStickSw(const InputEvent& e);
  void handleEncSwNav(const InputEvent& e);   // encoder = navegacion (abre menu)
  void handleFaceButton(const InputEvent& e); // botones 1-5: tap=capa / hold=toggle card
  void fireResolved(const InputEvent& e);     // resuelve y procesa la accion de la capa
  void statusToggle(int i);                   // long-press boton i -> toggle del card
  void enqueueClick(uint8_t button);

  KeyMap*       m_km = nullptr;
  StateManager* m_state = nullptr;
  uint8_t       m_activeLayer = 0;
  bool          m_mouseOn = false;

  // Gestos del SW del stick
  bool     m_stickLongDone = false;
  bool     m_tapPending = false;
  uint32_t m_tapMs = 0;

  // Botones de cara: ¿el long-press ya consumio el press? (para no disparar el tap al soltar)
  bool     m_btnConsumed[5] = {false, false, false, false, false};
  uint32_t m_longFlashMs[5] = {0, 0, 0, 0, 0};   // millis del ultimo long-press por boton (flash)

  // Navegacion del SW del encoder (tap=menu, doble=cicla modo del encoder, largo=cicla capa)
  bool     m_encLong = false;
  uint8_t  m_encOverride = 0;       // override del rotar: 0=capa,1=Vol,2=Scroll,3=Zoom,4=Pestanas
  bool     m_encTapPending = false;
  uint32_t m_encTapMs = 0;
};
