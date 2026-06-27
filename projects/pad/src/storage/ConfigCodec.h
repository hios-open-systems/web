// ============================================================================
//  ConfigCodec - (de)serializa el KeyMap (capas + bindings + acciones + labels)
//  a/desde JSON. Es el contrato que comparte la pagina de admin del companion.
//  No persiste (eso es ConfigStore); solo traduce.
//
//  Esquema (v1):
//    { "v":1, "layers":[ { "n":"Edicion","color":1535,"group":0,
//        "binds":[ { "id":0,"label":"Copiar","press":<action>,"long":<action>,"st":0 },
//                  { "id":14,"label":"Scroll","cw":<action>,"ccw":<action> } ] } ] }
//  <action> = { "t":"key|media|mouse|text|macro|layer|mtog|ncmd|nhttp|nmqtt|gpad|none", ... }
// ============================================================================
#pragma once
#include <ArduinoJson.h>

class KeyMap;

namespace cfgcodec {

void toJson(const KeyMap& km, JsonObject root);        // serializa el keymap actual
bool fromJson(JsonObjectConst root, KeyMap& km);       // reconstruye el keymap (true si valido)

}  // namespace cfgcodec
