#include "Dispatcher.h"
#include <Arduino.h>
#include "../app/Config.h"
#include "../app/EventBus.h"
#include "../app/AppState.h"
#include "../app/StateManager.h"
#include "../ui/Menu.h"
#include "../net/Net.h"

// Accion del encoder segun el modo override (cw = giro horario). 0 = sin override.
static Action encModeAction(uint8_t mode, bool cw) {
  switch (mode) {
    case 1: return mediaAction(cw ? MediaUsage::VOL_UP : MediaUsage::VOL_DOWN);  // Volumen
    case 2: return mouseAction(MouseMode::SCROLL_FROM_ENC, 0, 0, cw ? 1 : -1);   // Scroll
    case 3: return keyAction(kmod::CTRL, cw ? '=' : '-');                        // Zoom
    case 4: return keyCode(kmod::CTRL, cw ? 0xD6 : 0xD3);                        // Pestanas (PgDn/PgUp)
    default: return Action{};
  }
}

void Dispatcher::dispatch(const InputEvent& e) {
  if (!m_km) return;

  // SW del stick: gestos (tap/doble/largo).
  if (e.id == InputId::STICK_SW) { handleStickSw(e); return; }
  // SW del encoder: NAVEGACION (abre el menu); no dispara acciones de la capa.
  if (e.id == InputId::ENC_SW)   { handleEncSwNav(e); return; }

  // Override del encoder (doble-tap cicla modos): pisa la accion de la capa.
  if (e.id == InputId::ENC_ROT && e.edge == Edge::ROTATE && m_encOverride != 0) {
    Action a = encModeAction(m_encOverride, e.v1 > 0);
    if (m_state && a.type == ActionType::MEDIA) {
      if (a.p.media.usage == MediaUsage::VOL_UP)   m_state->bumpVolume(+4);
      if (a.p.media.usage == MediaUsage::VOL_DOWN) m_state->bumpVolume(-4);
    }
    if (a.type != ActionType::NONE) xQueueSend(bus::actionQueue, &a, 0);
    return;
  }

  // Botones de cara (1-5): tap = accion de capa (al SOLTAR); hold = toggle del card.
  if ((int)e.id <= (int)InputId::BTN_5) { handleFaceButton(e); return; }

  // El stick mueve el mouse SOLO si el modo mouse esta activo.
  if (e.id == InputId::STICK_AXIS && !m_mouseOn) return;

  fireResolved(e);
}

// Resuelve la accion de la capa para el evento y la procesa
// (LAYER / MOUSE_TOGGLE / estado optimista / volumen estimado / encolar).
void Dispatcher::fireResolved(const InputEvent& e) {
  Action a = m_km->resolve(m_activeLayer, e);
  if (a.type == ActionType::NONE) return;
  if (a.type == ActionType::LAYER) { applyLayer(a.p.layer); return; }
  if (a.type == ActionType::MOUSE_TOGGLE) {
    m_mouseOn = !m_mouseOn;
    if (m_state) m_state->setMouse(m_mouseOn);
    Serial.printf("[mouse] %s\n", m_mouseOn ? "ON" : "OFF");
    return;
  }
  if (a.type == ActionType::NET_CMD) {              // comando al companion (mute global, etc.)
    if (m_state && e.edge == Edge::PRESS) {
      StateToggle st = m_km->stateToggleFor(m_activeLayer, e.id);
      if (st != StateToggle::NONE) m_state->applyToggle(st);
    }
    if (e.edge == Edge::PRESS) net::queueCommand(a.p.cmd.cmd);
    return;
  }
  if (m_state && e.edge == Edge::PRESS) {
    StateToggle st = m_km->stateToggleFor(m_activeLayer, e.id);
    if (st != StateToggle::NONE) m_state->applyToggle(st);
  }
  if (m_state && a.type == ActionType::MEDIA) {
    if (a.p.media.usage == MediaUsage::VOL_UP)   m_state->bumpVolume(+4);
    if (a.p.media.usage == MediaUsage::VOL_DOWN) m_state->bumpVolume(-4);
  }
  xQueueSend(bus::actionQueue, &a, 0);
}

// Botones de cara: tap corto (al soltar) dispara la accion de la capa; mantener
// (long-press) togglea el estado del card que esta abajo de ese boton.
void Dispatcher::handleFaceButton(const InputEvent& e) {
  int i = (int)e.id;   // 0..4
  switch (e.edge) {
    case Edge::PRESS:      m_btnConsumed[i] = false; break;
    case Edge::LONG_PRESS: m_btnConsumed[i] = true; m_longFlashMs[i] = e.t_ms; statusToggle(i); break;
    case Edge::RELEASE:
      if (!m_btnConsumed[i]) {                       // fue tap corto -> accion de capa
        InputEvent pe = e; pe.edge = Edge::PRESS;
        fireResolved(pe);
      }
      break;
    default: break;
  }
}

// Toggle del card por long-press del boton N (universal, en cualquier capa):
//   1 mic     -> MUTE GLOBAL via companion (Core Audio, app-independiente)
//   2 camara  -> solo optimista (no hay mute de camara a nivel OS; la app lo hace en el tap)
//   3 media   -> play/pausa (HID universal)
//   4 volumen -> mute (HID universal)
//   5 enlace  -> WiFi on/off (no es HID; ahorro de energia)
void Dispatcher::statusToggle(int i) {
  Action a{};
  switch (i) {
    case 0: net::queueCommand(CompanionCmd::MIC_TOGGLE);
            if (m_state) m_state->applyToggle(StateToggle::MIC); return;     // mute global
    case 1: if (m_state) m_state->applyToggle(StateToggle::CAMERA); return;  // optimista
    case 2: a = mediaAction(MediaUsage::PLAY_PAUSE); if (m_state) m_state->applyToggle(StateToggle::MEDIA); break;
    case 3: a = mediaAction(MediaUsage::MUTE); break;
    case 4: net::toggleWifi(); return;
    default: return;
  }
  xQueueSend(bus::actionQueue, &a, 0);
}

// --- Navegacion: el SW del encoder abre el menu (tap). Sin acciones de capa. ---
void Dispatcher::handleEncSwNav(const InputEvent& e) {
  switch (e.edge) {
    case Edge::PRESS:      m_encLong = false; break;
    case Edge::LONG_PRESS: {                            // mantener -> ciclar capa
      m_encLong = true;
      m_encTapPending = false;
      LayerAction la; la.layer = 0; la.mode = LayerMode::NEXT;
      applyLayer(la);
      break;
    }
    case Edge::RELEASE:
      if (m_encLong) break;
      if (m_encTapPending && (e.t_ms - m_encTapMs) <= cfg::DOUBLE_TAP_MS) {
        m_encTapPending = false;
        m_encOverride = (m_encOverride + 1) % 5;       // doble-tap -> cicla modo del encoder
        Serial.printf("[enc] modo override = %u\n", m_encOverride);
      } else {
        m_encTapPending = true; m_encTapMs = e.t_ms;   // espera posible 2do tap (el menu abre en tick)
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
      if (m_mouseOn) enqueueClick(0x01);       // tap -> click izquierdo INSTANTANEO (sin esperar doble-tap)
      break;
    default:
      break;
  }
}

void Dispatcher::tick(uint32_t now) {
  // Encoder: el tap simple expira (no hubo 2do) -> abrir menu.
  if (m_encTapPending && (now - m_encTapMs) > cfg::DOUBLE_TAP_MS) {
    m_encTapPending = false;
    menu::open(m_activeLayer);
    appstate::mode = AppMode::MENU;
  }
}

// Bits de los botones cuyo long-press disparo hace < 160ms (flash de confirmacion).
uint8_t Dispatcher::longFlashMask(uint32_t now) const {
  uint8_t m = 0;
  for (int i = 0; i < 5; i++)
    if (m_longFlashMs[i] && (now - m_longFlashMs[i]) < 400) m |= (1 << i);   // flash visible ~400ms
  return m;
}

void Dispatcher::enqueueClick(uint8_t button) {
  m_lastClickBtn = (button == 0x02) ? 2 : 1;   // para el flash L/R del box del mouse
  m_lastClickMs  = millis();
  Action a = mouseAction(MouseMode::CLICK, 0, 0, 0, button);
  xQueueSend(bus::actionQueue, &a, 0);
}

uint8_t Dispatcher::clickFlash(uint32_t now) const {
  return (now - m_lastClickMs < 220) ? m_lastClickBtn : 0;   // ~220ms de flash
}

void Dispatcher::setLayer(uint8_t n) {
  if (m_km && n < m_km->count()) {
    m_activeLayer = n;
    m_encOverride = 0;                       // cada capa arranca con SU comportamiento de encoder
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
  m_encOverride = 0;                         // reset del override del encoder al cambiar de capa
  Serial.printf("[layer] -> %u (%s)\n", m_activeLayer, m_km->layer(m_activeLayer).name);
}
