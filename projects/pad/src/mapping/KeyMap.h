// ============================================================================
//  KeyMap - Tabla de bindings POR CAPA. Cada capa tiene nombre, color y un
//  binding por input (onPress / onLongPress / rotacion CW-CCW + un label corto
//  para la UI). resolve() traduce un InputEvent a Action segun la capa activa.
//  Se llena con builders (los usa DefaultConfig; en M3 lo llenara el JSON).
// ============================================================================
#pragma once
#include "../app/Types.h"
#include "../actions/Action.h"

static constexpr uint8_t MAX_LAYERS = 16;   // margen para capas nuevas (apps de llamada, etc.)
static constexpr uint8_t LABEL_LEN  = 14;

// Grupo tematico de la capa: lo usa el menu para agrupar (las muestra de a <=5
// sobre los botones). Cada capa declara el suyo en DefaultConfig.
enum class LayerGroup : uint8_t { TRABAJO, MULTIMEDIA, WEB, LLAMADAS, SISTEMA, _COUNT };

struct Binding {
  Action      onPress;
  Action      onLongPress;
  Action      onRotateCW;     // solo para ENC_ROT
  Action      onRotateCCW;
  char        label[LABEL_LEN];
  StateToggle stateToggle = StateToggle::NONE;  // qué estado togglea (para la UI)
};

struct Layer {
  char       name[LABEL_LEN];
  uint16_t   color;
  LayerGroup group = LayerGroup::TRABAJO;
  Binding    bindings[(int)InputId::_COUNT];
};

class KeyMap {
public:
  // --- Builders (config) ---
  void clear() { m_count = 0; }
  int  addLayer(const char* name, uint16_t color,
                LayerGroup group = LayerGroup::TRABAJO);
  void bind(int layer, InputId id, const Action& onPress, const char* label,
            const Action& onLong = Action{}, StateToggle st = StateToggle::NONE);
  void bindRotate(int layer, const Action& cw, const Action& ccw, const char* label);

  // --- Consulta ---
  uint8_t      count() const { return m_count; }
  const Layer& layer(uint8_t i) const { return m_layers[i < m_count ? i : 0]; }
  Action       resolve(uint8_t layer, const InputEvent& e) const;
  const char*  label(uint8_t layer, InputId id) const;
  StateToggle  stateToggleFor(uint8_t layer, InputId id) const;

private:
  Layer   m_layers[MAX_LAYERS];
  uint8_t m_count = 0;
};
