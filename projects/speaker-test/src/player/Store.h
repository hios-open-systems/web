// HIOS Speaker Test - Persistencia de la ultima cancion (device)
// -----------------------------------------------------------------------------
// Guarda el JSON wire crudo en LittleFS (/song.json) y lo carga al boot. Se usa
// LittleFS (no NVS) porque una cancion llega hasta ~16 KB y la particion NVS por
// defecto es chica (~20 KB) y sus blobs no son para ese tamano.
// -----------------------------------------------------------------------------
#pragma once
#include <stddef.h>
#include "SongModel.h"

namespace store {

void begin();                                   // monta LittleFS
bool save(const char* json, size_t len);        // escribe /song.json
bool loadInto(DeviceSong& out);                 // lee + parsea; false si no hay
void clear();                                   // borra /song.json

}  // namespace store
