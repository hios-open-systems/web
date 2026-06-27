// ============================================================================
//  ConfigCodec.cpp - ver ConfigCodec.h.
// ============================================================================
#include "ConfigCodec.h"
#include "../mapping/KeyMap.h"   // KeyMap, Layer, Binding, LayerGroup (+ Action/Types via includes)
#include "DefaultConfig.h"       // tablas runtime de textos/macros (builders + accessors) + MacroStep
#include <string.h>

namespace cfgcodec {

// --- Action <-> JSON ---------------------------------------------------------
static void actToJson(JsonObject o, const Action& a) {
  switch (a.type) {
    case ActionType::KEY: {
      o["t"] = "key";
      o["mods"] = a.p.key.modifiers;
      JsonArray k = o["k"].to<JsonArray>();
      for (uint8_t i = 0; i < 6 && a.p.key.keys[i]; i++) k.add(a.p.key.keys[i]);
      break;
    }
    case ActionType::MEDIA:
      o["t"] = "media"; o["u"] = (uint16_t)a.p.media.usage; break;
    case ActionType::MOUSE:
      o["t"] = "mouse"; o["mode"] = (uint8_t)a.p.mouse.mode;
      o["dx"] = a.p.mouse.dx; o["dy"] = a.p.mouse.dy;
      o["wheel"] = a.p.mouse.wheel; o["btn"] = a.p.mouse.buttons; break;
    case ActionType::TEXT:  o["t"] = "text";  o["id"]  = a.p.text.id;  break;
    case ActionType::MACRO: o["t"] = "macro"; o["id"]  = a.p.macro.id; break;
    case ActionType::LAYER:
      o["t"] = "layer"; o["mode"] = (uint8_t)a.p.layer.mode; o["n"] = a.p.layer.layer; break;
    case ActionType::MOUSE_TOGGLE: o["t"] = "mtog"; break;
    case ActionType::NET_HTTP: o["t"] = "nhttp"; o["id"] = a.p.net.id; break;
    case ActionType::NET_MQTT: o["t"] = "nmqtt"; o["id"] = a.p.net.id; break;
    case ActionType::NET_CMD:  o["t"] = "ncmd";  o["cmd"] = (uint8_t)a.p.cmd.cmd; break;
    case ActionType::NET_LAUNCH: o["t"] = "launch"; o["id"] = a.p.launch.id; break;
    case ActionType::GAMEPAD:  o["t"] = "gpad"; break;
    default:                   o["t"] = "none"; break;
  }
}

static Action actFromJson(JsonVariantConst v) {
  Action a;                                   // NONE por defecto
  if (v.isNull()) return a;
  const char* t = v["t"] | "none";
  if (!strcmp(t, "key")) {
    a.type = ActionType::KEY;
    a.p.key.modifiers = (uint8_t)(v["mods"] | 0);
    for (uint8_t i = 0; i < 6; i++) a.p.key.keys[i] = 0;
    uint8_t i = 0;
    for (JsonVariantConst kv : v["k"].as<JsonArrayConst>()) { if (i >= 6) break; a.p.key.keys[i++] = (uint8_t)kv.as<int>(); }
  } else if (!strcmp(t, "media")) {
    a.type = ActionType::MEDIA; a.p.media.usage = (MediaUsage)(uint16_t)(v["u"] | 0);
  } else if (!strcmp(t, "mouse")) {
    a.type = ActionType::MOUSE;
    a.p.mouse.mode    = (MouseMode)(uint8_t)(v["mode"] | 0);
    a.p.mouse.dx      = (int8_t)(v["dx"] | 0);
    a.p.mouse.dy      = (int8_t)(v["dy"] | 0);
    a.p.mouse.wheel   = (int8_t)(v["wheel"] | 0);
    a.p.mouse.buttons = (uint8_t)(v["btn"] | 0);
  } else if (!strcmp(t, "text")) {
    a.type = ActionType::TEXT;  a.p.text.id  = (uint16_t)(v["id"] | 0);
  } else if (!strcmp(t, "macro")) {
    a.type = ActionType::MACRO; a.p.macro.id = (uint16_t)(v["id"] | 0);
  } else if (!strcmp(t, "layer")) {
    a.type = ActionType::LAYER;
    a.p.layer.mode  = (LayerMode)(uint8_t)(v["mode"] | 0);
    a.p.layer.layer = (uint8_t)(v["n"] | 0);
  } else if (!strcmp(t, "mtog")) {
    a.type = ActionType::MOUSE_TOGGLE;
  } else if (!strcmp(t, "nhttp")) {
    a.type = ActionType::NET_HTTP; a.p.net.id = (uint16_t)(v["id"] | 0);
  } else if (!strcmp(t, "nmqtt")) {
    a.type = ActionType::NET_MQTT; a.p.net.id = (uint16_t)(v["id"] | 0);
  } else if (!strcmp(t, "ncmd")) {
    a.type = ActionType::NET_CMD;  a.p.cmd.cmd = (CompanionCmd)(uint8_t)(v["cmd"] | 0);
  } else if (!strcmp(t, "launch")) {
    a.type = ActionType::NET_LAUNCH; a.p.launch.id = (uint16_t)(v["id"] | 0);
  } else if (!strcmp(t, "gpad")) {
    a.type = ActionType::GAMEPAD;
  }
  return a;
}

// --- KeyMap <-> JSON ---------------------------------------------------------
void toJson(const KeyMap& km, JsonObject root) {
  root["v"] = 1;
  JsonArray layers = root["layers"].to<JsonArray>();
  for (uint8_t i = 0; i < km.count(); i++) {
    const Layer& L = km.layer(i);
    JsonObject lo = layers.add<JsonObject>();
    lo["n"]     = L.name;          // const char* (lifetime del keymap durante la serializacion)
    lo["color"] = L.color;
    lo["group"] = (uint8_t)L.group;
    JsonArray binds = lo["binds"].to<JsonArray>();
    for (int id = 0; id <= (int)InputId::ENC_ROT; id++) {
      const Binding& b = L.bindings[id];
      const bool enc = (id == (int)InputId::ENC_ROT);
      const bool has = b.label[0] || b.onPress.type != ActionType::NONE ||
                       b.onLongPress.type != ActionType::NONE ||
                       (enc && (b.onRotateCW.type != ActionType::NONE || b.onRotateCCW.type != ActionType::NONE));
      if (!has) continue;
      JsonObject e = binds.add<JsonObject>();
      e["id"] = id;
      if (b.label[0]) e["label"] = L.bindings[id].label;
      if (enc) {
        if (b.onRotateCW.type  != ActionType::NONE) actToJson(e["cw"].to<JsonObject>(),  b.onRotateCW);
        if (b.onRotateCCW.type != ActionType::NONE) actToJson(e["ccw"].to<JsonObject>(), b.onRotateCCW);
      } else {
        if (b.onPress.type     != ActionType::NONE) actToJson(e["press"].to<JsonObject>(), b.onPress);
        if (b.onLongPress.type != ActionType::NONE) actToJson(e["long"].to<JsonObject>(),  b.onLongPress);
        if (b.stateToggle != StateToggle::NONE)     e["st"] = (uint8_t)b.stateToggle;
      }
    }
  }

  // ALT momentaneos: que capa abre cada uno + linger
  JsonObject alt = root["alt"].to<JsonObject>();
  alt["alt1"]   = altLayer1();
  alt["alt2"]   = altLayer2();
  alt["linger"] = altLinger();

  // textos (snippets) + macros (secuencias de pasos)
  JsonArray texts = root["texts"].to<JsonArray>();
  for (uint16_t i = 0; i < textCount(); i++) texts.add(textById(i));
  JsonArray macros = root["macros"].to<JsonArray>();
  for (uint16_t i = 0; i < macroCount(); i++) {
    JsonObject mo = macros.add<JsonObject>();
    mo["label"] = macroLabel(i);
    JsonArray steps = mo["steps"].to<JsonArray>();
    uint8_t n = 0; const MacroStep* st = macroSteps(i, n);
    for (uint8_t j = 0; j < n; j++) {
      JsonObject so = steps.add<JsonObject>();
      so["kind"] = (uint8_t)st[j].kind;
      if (st[j].kind == MacroStep::KEY || st[j].kind == MacroStep::MEDIA || st[j].kind == MacroStep::MOUSE)
        actToJson(so["action"].to<JsonObject>(), st[j].action);
      if (st[j].kind == MacroStep::DELAY || st[j].kind == MacroStep::TEXT)
        so["arg"] = st[j].arg;
    }
  }
}

bool fromJson(JsonObjectConst root, KeyMap& km) {
  JsonArrayConst layers = root["layers"];
  if (layers.isNull()) return false;
  km.clear();
  for (JsonObjectConst lo : layers) {
    const char* name = lo["n"] | "Capa";
    uint16_t    color = (uint16_t)(lo["color"] | 0xFFFF);
    LayerGroup  grp   = (LayerGroup)(uint8_t)(lo["group"] | 0);
    int li = km.addLayer(name, color, grp);
    for (JsonObjectConst e : lo["binds"].as<JsonArrayConst>()) {
      int id = e["id"] | -1;
      if (id < 0 || id > (int)InputId::ENC_ROT) continue;
      const char* label = e["label"] | "";
      if (id == (int)InputId::ENC_ROT) {
        km.bindRotate(li, actFromJson(e["cw"]), actFromJson(e["ccw"]), label);
      } else {
        StateToggle st = (StateToggle)(uint8_t)(e["st"] | 0);
        km.bind(li, (InputId)id, actFromJson(e["press"]), label, actFromJson(e["long"]), st);
      }
    }
  }

  // ALT momentaneos (si viene; si no, defaults compilados)
  if (root["alt"].is<JsonObjectConst>()) {
    JsonObjectConst al = root["alt"];
    setAltConfig(al["alt1"] | "Launcher", al["alt2"] | "Macros", (uint32_t)(al["linger"] | 600));
  } else {
    seedDefaultAlt();
  }

  // textos + macros (si vienen en el JSON; si no, defaults compilados)
  if (root["texts"].is<JsonArrayConst>() || root["macros"].is<JsonArrayConst>()) {
    clearMacrosTexts();
    for (JsonVariantConst t : root["texts"].as<JsonArrayConst>()) addText(t.as<const char*>());
    for (JsonObjectConst m : root["macros"].as<JsonArrayConst>()) {
      int id = addMacro(m["label"] | "");
      if (id < 0) break;
      for (JsonObjectConst s : m["steps"].as<JsonArrayConst>()) {
        MacroStep step;
        step.kind   = (MacroStep::Kind)(uint8_t)(s["kind"] | 0);
        step.action = actFromJson(s["action"]);
        step.arg    = (uint16_t)(s["arg"] | 0);
        addMacroStep((uint16_t)id, step);
      }
    }
  } else {
    seedDefaultMacrosTexts();
  }

  return km.count() > 0;
}

}  // namespace cfgcodec
