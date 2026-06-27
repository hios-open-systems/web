// ============================================================================
//  ConfigStore - Persistencia del config del usuario en LittleFS (/config.json).
//  Usa la particion "spiffs" que ya trae default_8MB.csv (no cambia la tabla).
//  Guarda/lee el JSON crudo; el (de)serializado al KeyMap vive en ConfigCodec.
//  Estrategia de aplicacion: PUT guarda + reinicia (se aplica en el boot), sin
//  swap del keymap en caliente (mas seguro entre cores).
// ============================================================================
#pragma once
#include <Arduino.h>

namespace cfgstore {

void begin();                              // monta LittleFS (formatea si hace falta)
bool load(String& out);                    // lee /config.json -> out (true si existe y no vacio)
bool save(const char* json, size_t len);   // escribe /config.json
void remove();                             // borra /config.json (volver a defaults compilados)

}  // namespace cfgstore
