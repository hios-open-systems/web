#include "KeyMap.h"
#include <string.h>
#include "../app/Config.h"

static void copyLabel(char* dst, const char* src) {
  strncpy(dst, src ? src : "", LABEL_LEN - 1);
  dst[LABEL_LEN - 1] = '\0';
}

int KeyMap::addLayer(const char* name, uint16_t color) {
  if (m_count >= MAX_LAYERS) return m_count - 1;
  Layer& L = m_layers[m_count];
  copyLabel(L.name, name);
  L.color = color;
  for (int i = 0; i < (int)InputId::_COUNT; i++) {
    L.bindings[i] = Binding{};
    L.bindings[i].label[0] = '\0';
  }
  return m_count++;
}

void KeyMap::bind(int layer, InputId id, const Action& onPress, const char* label,
                  const Action& onLong, StateToggle st) {
  if (layer < 0 || layer >= m_count) return;
  Binding& b = m_layers[layer].bindings[(int)id];
  b.onPress = onPress;
  b.onLongPress = onLong;
  b.stateToggle = st;
  copyLabel(b.label, label);
}

StateToggle KeyMap::stateToggleFor(uint8_t layer, InputId id) const {
  if (layer >= m_count) layer = 0;
  return m_layers[layer].bindings[(int)id].stateToggle;
}

void KeyMap::bindRotate(int layer, const Action& cw, const Action& ccw, const char* label) {
  if (layer < 0 || layer >= m_count) return;
  Binding& b = m_layers[layer].bindings[(int)InputId::ENC_ROT];
  b.onRotateCW = cw;
  b.onRotateCCW = ccw;
  copyLabel(b.label, label);
}

const char* KeyMap::label(uint8_t layer, InputId id) const {
  if (layer >= m_count) layer = 0;
  return m_layers[layer].bindings[(int)id].label;
}

Action KeyMap::resolve(uint8_t layerIdx, const InputEvent& e) const {
  if (layerIdx >= m_count) layerIdx = 0;
  const Layer& L = m_layers[layerIdx];

  // Encoder: girar -> binding de rotacion de la capa (modo de encoder).
  if (e.id == InputId::ENC_ROT && e.edge == Edge::ROTATE) {
    const Binding& b = L.bindings[(int)InputId::ENC_ROT];
    Action a = (e.v1 > 0) ? b.onRotateCW : b.onRotateCCW;
    // Si el modo es scroll, pasamos el delta como rueda.
    if (a.type == ActionType::MOUSE && a.p.mouse.mode == MouseMode::SCROLL_FROM_ENC)
      a.p.mouse.wheel = (int8_t)e.v1;
    return a;
  }

  // Stick: mover -> mouse (global por ahora; e.v1/v2 ya normalizados -127..127).
  if (e.id == InputId::STICK_AXIS && e.edge == Edge::MOVE) {
    int rawX = e.v1, rawY = e.v2;
    if (cfg::MOUSE_SWAP_XY) { int t = rawX; rawX = rawY; rawY = t; }  // stick girado 90
    int dx = rawX / cfg::MOUSE_SPEED_DIV;
    int dy = rawY / cfg::MOUSE_SPEED_DIV;
    if (cfg::MOUSE_INVERT_X) dx = -dx;   // horizontal en pantalla
    if (cfg::MOUSE_INVERT_Y) dy = -dy;   // vertical en pantalla
    return mouseAction(MouseMode::MOVE_FROM_STICK, (int8_t)dx, (int8_t)dy);
  }

  // Pulsadores (BTN_1..STICK_SW): press / long-press.
  if ((int)e.id < (int)InputId::ENC_ROT) {
    const Binding& b = L.bindings[(int)e.id];
    if (e.edge == Edge::PRESS)      return b.onPress;
    if (e.edge == Edge::LONG_PRESS) return b.onLongPress;
  }
  return Action{};  // NONE
}
