#include "Dispatcher.h"
#include <Arduino.h>
#include "../app/Config.h"
#include "../app/EventBus.h"
#include "../app/AppState.h"
#include "../app/StateManager.h"
#include "../ui/Menu.h"

void Dispatcher::dispatch(const InputEvent& e) {
  if (!m_km) return;

  // SW del stick: gestos (tap/doble/largo).
  if (e.id == InputId::STICK_SW) { handleStickSw(e); return; }
  // SW del encoder: NAVEGACION (abre el menu); no dispara acciones de la capa.
  if (e.id == InputId::ENC_SW)   { handleEncSwNav(e); return; }

  // El stick mueve el mouse SOLO si el modo mouse esta activo.
  if (e.id == InputId::STICK_AXIS && !m_mouseOn) return;

  Action a = m_km->resolve(m_activeLayer, e);
  if (a.type == ActionType::NONE) return;

  if (a.type == ActionType::LAYER) { applyLayer(a.p.layer); return; }
  if (a.type == ActionType::MOUSE_TOGGLE) {
    m_mouseOn = !m_mouseOn;
    if (m_state) m_state->setMouse(m_mouseOn);
    Serial.printf("[mouse] %s\n", m_mouseOn ? "ON" : "OFF");
    return;
  }

  // Estado optimista: si el binding (en PRESS) togglea algo, reflejarlo.
  if (m_state && e.edge == Edge::PRESS) {
    StateToggle st = m_km->stateToggleFor(m_activeLayer, e.id);
    if (st != StateToggle::NONE) m_state->applyToggle(st);
  }
  // Volumen estimado: media VOL_UP/DOWN (del encoder o de un boton).
  if (m_state && a.type == ActionType::MEDIA) {
    if (a.p.media.usage == MediaUsage::VOL_UP)   m_state->bumpVolume(+4);
    if (a.p.media.usage == MediaUsage::VOL_DOWN) m_state->bumpVolume(-4);
  }

  xQueueSend(bus::actionQueue, &a, 0);
}

// --- Navegacion: el SW del encoder abre el menu (tap). Sin acciones de capa. ---
void Dispatcher::handleEncSwNav(const InputEvent& e) {
  switch (e.edge) {
    case Edge::PRESS:      m_encLong = false; break;
    case Edge::LONG_PRESS: {                            // mantener -> ciclar capa
      m_encLong = true;
      LayerAction la; la.layer = 0; la.mode = LayerMode::NEXT;
      applyLayer(la);
      break;
    }
    case Edge::RELEASE:
      if (!m_encLong) {                                // tap -> abrir menu
        menu::open(m_activeLayer);
        appstate::mode = AppMode::MENU;
      }
      break;
    default: break;
  }
}

// --- Gestos del SW del stick (tap=click izq / doble=click der / largo=toggle) ---
void Dispatcher::handleStickSw(const InputEvent& e) {
  switch (e.edge) {
    case Edge::PRESS:
      m_stickLongDone = false;
      break;
    case Edge::LONG_PRESS:
      m_mouseOn = !m_mouseOn;
      if (m_state) m_state->setMouse(m_mouseOn);
      m_stickLongDone = true;
      Serial.printf("[mouse] %s (long)\n", m_mouseOn ? "ON" : "OFF");
      break;
    case Edge::RELEASE:
      if (m_stickLongDone) break;
      if (m_tapPending && (e.t_ms - m_tapMs) <= cfg::DOUBLE_TAP_MS) {
        m_tapPending = false;
        if (m_mouseOn) enqueueClick(0x02);     // doble -> click derecho
      } else {
        m_tapPending = true;
        m_tapMs = e.t_ms;
      }
      break;
    default:
      break;
  }
}

void Dispatcher::tick(uint32_t now) {
  if (m_tapPending && (now - m_tapMs) > cfg::DOUBLE_TAP_MS) {
    m_tapPending = false;
    if (m_mouseOn) enqueueClick(0x01);          // tap simple -> click izquierdo
  }
}

void Dispatcher::enqueueClick(uint8_t button) {
  Action a = mouseAction(MouseMode::CLICK, 0, 0, 0, button);
  xQueueSend(bus::actionQueue, &a, 0);
}

void Dispatcher::setLayer(uint8_t n) {
  if (m_km && n < m_km->count()) {
    m_activeLayer = n;
    Serial.printf("[layer] -> %u (%s)\n", m_activeLayer, m_km->layer(m_activeLayer).name);
  }
}

void Dispatcher::applyLayer(const LayerAction& la) {
  uint8_t n = m_km->count();
  if (n == 0) return;
  switch (la.mode) {
    case LayerMode::NEXT:   m_activeLayer = (m_activeLayer + 1) % n; break;
    case LayerMode::PREV:   m_activeLayer = (m_activeLayer + n - 1) % n; break;
    case LayerMode::SWITCH: if (la.layer < n) m_activeLayer = la.layer; break;
    case LayerMode::TOGGLE: m_activeLayer = m_activeLayer ? 0 : (n > 1 ? 1 : 0); break;
  }
  Serial.printf("[layer] -> %u (%s)\n", m_activeLayer, m_km->layer(m_activeLayer).name);
}
