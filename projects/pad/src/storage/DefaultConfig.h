// ============================================================================
//  DefaultConfig - Config por defecto (capas, textos y macros) en codigo.
//  Sirve como fallback y como base hasta que M3 cargue todo desde JSON.
// ============================================================================
#pragma once
#include "../mapping/KeyMap.h"
#include "../actions/MacroEngine.h"

// Llena el KeyMap con las capas por defecto.
void loadDefaults(KeyMap& km);

// Snippet de texto por id (para acciones TEXT y pasos de macro).
const char* textById(uint16_t id);

// Pasos de un macro por id (out: cantidad). Devuelve nullptr si no existe.
const MacroStep* macroSteps(uint16_t id, uint8_t& count);
