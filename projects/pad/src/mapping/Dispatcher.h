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
  void begin(KeyMap* km);              // resuelve las capas ALT por nombre
  void setState(StateManager* s) { m_state = s; }
  void dispatch(const InputEvent& e);
  void tick(uint32_t now);             // cierra el tap simple del stick + revierte el ALT momentaneo

  uint8_t activeLayer() const { return m_activeLayer; }
  void    setLayer(uint8_t n);
  bool    mouseOn() const { return m_mouseOn; }
  uint8_t encMode() const { return m_encOverride; }     // 0=capa, 1=Vol, 2=Scroll, 3=Zoom, 4=Pestanas
  uint8_t altActive() const { return m_momentaryAlt; }  // 0=ninguno, 1=ALT1, 2=ALT2 (held o en linger) -> feedback UI
  uint8_t clickFlash(uint32_t now) const;               // click reciente del mouse: 0=nada, 1=izq, 2=der (ventana de flash)

private:
  void applyLayer(const LayerAction& la);
  void handleStickSw(const InputEvent& e);
  void handleEncSwNav(const InputEvent& e);   // encoder = navegacion (abre menu)
  void handleAlt(const InputEvent& e);        // ALT_1/ALT_2: capa momentanea (hold + linger)
  void handleFaceButton(const InputEvent& e); // botones 1-10: una sola accion (la de la capa)
  void fireResolved(const InputEvent& e);     // resuelve y procesa la accion de la capa
  void enqueueClick(uint8_t button);
  uint8_t layerEncMode() const;               // modo de override que la capa ya hace de fabrica (0=ninguno)

  KeyMap*       m_km = nullptr;
  StateManager* m_state = nullptr;
  uint8_t       m_activeLayer = 0;
  bool          m_mouseOn = false;

  // ALT momentaneo (hold -> capa Launcher/Macros; al soltar, linger anti-falsos-release)
  int8_t        m_altLayer[2] = {-1, -1};   // indices de ALT1_LAYER/ALT2_LAYER (resueltos en begin)
  uint8_t       m_momentaryAlt = 0;         // 0=ninguno, 1=ALT1, 2=ALT2
  uint8_t       m_prevLayer = 0;            // capa a la que volver al terminar
  bool          m_altHeld = false;          // el ALT sigue presionado
  uint32_t      m_altLingerEnd = 0;         // millis de fin de la ventana de gracia
  uint32_t      m_altLinger = 600;          // ventana de gracia (del config, se resuelve en begin)

  // Gestos del SW del stick
  bool     m_stickLongDone = false;
  bool     m_stickDblConsumed = false;   // el press fue el 2do tap de un doble -> su release no encola nada
  bool     m_tapPending = false;         // tap simple esperando la ventana de doble-tap (puede volverse derecho)
  uint32_t m_tapMs = 0;
  uint8_t  m_lastClickBtn = 0;       // 1=izq, 2=der (para el flash en el box del mouse)
  uint32_t m_lastClickMs = 0;

  // Navegacion del SW del encoder (tap=menu, doble=cicla modo del encoder, largo=cicla capa)
  bool     m_encLong = false;
  bool     m_encDown = false;       // el Dispatcher vio el PRESS? (descarta RELEASE huerfanos al salir del menu)
  uint8_t  m_encOverride = 0;       // override del rotar: 0=capa,1=Vol,2=Scroll,3=Zoom,4=Pestanas
  bool     m_encTapPending = false;
  uint32_t m_encTapMs = 0;
};
