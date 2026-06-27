// ============================================================================
//  DefaultConfig - Config por defecto (capas, textos y macros) en codigo.
//  Sirve como fallback y como base hasta que M3 cargue todo desde JSON.
// ============================================================================
#pragma once
#include "../mapping/KeyMap.h"
#include "../actions/MacroEngine.h"

// Llena el KeyMap con las capas por defecto (y siembra macros/textos default).
void loadDefaults(KeyMap& km);

// --- Tablas RUNTIME de textos/macros (las puebla ConfigCodec desde JSON, o
//     seedDefaultMacrosTexts() con los defaults compilados). textById/macroSteps
//     mantienen su firma (los usan MacroEngine y main) leyendo de estas tablas. ---
void        clearMacrosTexts();
bool        addText(const char* s);
int         addMacro(const char* label);                 // -1 si no hay lugar
bool        addMacroStep(uint16_t macroId, const MacroStep& step);
void        seedDefaultMacrosTexts();                    // carga los defaults compilados
uint16_t    textCount();
uint16_t    macroCount();
const char* macroLabel(uint16_t id);

// --- ALT momentaneos: que capa abre cada uno + linger (editable; default = Config.h) ---
void        setAltConfig(const char* alt1, const char* alt2, uint32_t lingerMs);
void        seedDefaultAlt();
const char* altLayer1();
const char* altLayer2();
uint32_t    altLinger();

// Snippet de texto por id (para acciones TEXT y pasos de macro).
const char* textById(uint16_t id);

// Pasos de un macro por id (out: cantidad). Devuelve nullptr si no existe.
const MacroStep* macroSteps(uint16_t id, uint8_t& count);
