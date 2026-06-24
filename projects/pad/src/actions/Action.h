// ============================================================================
//  Action.h - El modelo de accion: union etiquetada (tag + payload).
//  Es el CONTRATO central que hace coexistir teclado/media/mouse/red/(futuro)
//  gamepad sin tocar el resto. POD, sin heap, serializable y de tamano fijo.
//  Las acciones de red guardan solo un id que indexa una tabla aparte
//  (las strings URL/topic/body no viven en el Action).
// ============================================================================
#pragma once
#include <stdint.h>
#include <Arduino.h>

enum class ActionType : uint8_t {
  NONE,
  KEY,        // teclado: modificadores + hasta 6 teclas
  MEDIA,      // consumer control (play/pause/volumen)
  MOUSE,      // mover / boton / rueda
  TEXT,       // teclear un snippet de texto (indexa la tabla de textos)
  MACRO,      // ejecutar una secuencia (indexa la tabla de macros)
  LAYER,      // cambiar de capa
  MOUSE_TOGGLE, // activar/desactivar el modo mouse del stick (estilo TrackPoint)
  NET_HTTP,   // disparar request HTTP (indexa NetActionTable)
  NET_MQTT,   // publicar MQTT (indexa NetActionTable)
  GAMEPAD     // RESERVADO (post-v1); el tag existe para no romper enum/JSON
};

// Bits de modificadores de teclado.
namespace kmod { enum : uint8_t { CTRL = 1, SHIFT = 2, ALT = 4, GUI = 8 }; }

// Usages de consumer control (se mapean al transporte en M2).
enum class MediaUsage : uint16_t {
  NONE = 0, VOL_UP, VOL_DOWN, MUTE, PLAY_PAUSE, NEXT, PREV, STOP
};

// Modo de una accion de mouse.
enum class MouseMode : uint8_t { CLICK, MOVE_FROM_STICK, SCROLL_FROM_ENC };

// Modo de una accion de capa.
enum class LayerMode : uint8_t { SWITCH, TOGGLE, NEXT, PREV };

struct KeyAction   { uint8_t modifiers; uint8_t keys[6]; };  // keys: ASCII / codigos
struct MediaAction { MediaUsage usage; };
struct MouseAction { int8_t dx, dy, wheel; uint8_t buttons; MouseMode mode; };
struct LayerAction { uint8_t layer; LayerMode mode; };
struct NetRef      { uint16_t id; };
struct MacroRef    { uint16_t id; };
struct TextRef     { uint16_t id; };

struct Action {
  ActionType type = ActionType::NONE;
  union Payload {
    KeyAction   key;
    MediaAction media;
    MouseAction mouse;
    LayerAction layer;
    NetRef      net;
    MacroRef    macro;
    TextRef     text;
    Payload() : key{0, {0, 0, 0, 0, 0, 0}} {}
  } p;
};

// --- Constructores de conveniencia ---
inline Action keyAction(uint8_t mods, char k0, char k1 = 0) {
  Action a; a.type = ActionType::KEY;
  a.p.key = {mods, {(uint8_t)k0, (uint8_t)k1, 0, 0, 0, 0}};
  return a;
}
// Para teclas no-ASCII (F1-F12, flechas, etc.): se pasa el keycode crudo.
inline Action keyCode(uint8_t mods, uint8_t code) {
  Action a; a.type = ActionType::KEY;
  a.p.key = {mods, {code, 0, 0, 0, 0, 0}};
  return a;
}
inline Action mediaAction(MediaUsage u) {
  Action a; a.type = ActionType::MEDIA; a.p.media = {u}; return a;
}
inline Action mouseAction(MouseMode m, int8_t dx = 0, int8_t dy = 0,
                          int8_t wheel = 0, uint8_t buttons = 0) {
  Action a; a.type = ActionType::MOUSE; a.p.mouse = {dx, dy, wheel, buttons, m};
  return a;
}
inline Action layerAction(LayerMode m, uint8_t layer = 0) {
  Action a; a.type = ActionType::LAYER; a.p.layer = {layer, m}; return a;
}
inline Action textAction(uint16_t id) {
  Action a; a.type = ActionType::TEXT; a.p.text = {id}; return a;
}
inline Action macroAction(uint16_t id) {
  Action a; a.type = ActionType::MACRO; a.p.macro = {id}; return a;
}
inline Action mouseToggleAction() {
  Action a; a.type = ActionType::MOUSE_TOGGLE; return a;
}

// Descripcion legible para logging (M1).
inline String describeAction(const Action& a) {
  switch (a.type) {
    case ActionType::NONE:  return "NONE";
    case ActionType::KEY: {
      String s = "KEY mods=" + String(a.p.key.modifiers) + " [";
      for (uint8_t i = 0; i < 6 && a.p.key.keys[i]; i++) {
        if (i) s += ',';
        char c = (char)a.p.key.keys[i];
        s += (c >= 32 && c < 127) ? String(c) : ("0x" + String(a.p.key.keys[i], HEX));
      }
      return s + "]";
    }
    case ActionType::MEDIA: return "MEDIA usage=" + String((uint16_t)a.p.media.usage);
    case ActionType::MOUSE: return "MOUSE mode=" + String((uint8_t)a.p.mouse.mode) +
                                   " dx=" + String(a.p.mouse.dx) + " dy=" + String(a.p.mouse.dy) +
                                   " w=" + String(a.p.mouse.wheel) + " b=" + String(a.p.mouse.buttons);
    case ActionType::TEXT:  return "TEXT #" + String(a.p.text.id);
    case ActionType::MACRO: return "MACRO #" + String(a.p.macro.id);
    case ActionType::LAYER: return "LAYER mode=" + String((uint8_t)a.p.layer.mode) +
                                   " n=" + String(a.p.layer.layer);
    case ActionType::MOUSE_TOGGLE: return "MOUSE_TOGGLE";
    case ActionType::NET_HTTP: return "NET_HTTP #" + String(a.p.net.id);
    case ActionType::NET_MQTT: return "NET_MQTT #" + String(a.p.net.id);
    case ActionType::GAMEPAD:  return "GAMEPAD";
    default: return "?";
  }
}
