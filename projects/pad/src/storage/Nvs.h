// ============================================================================
//  Nvs - Wrapper fino sobre Preferences (NVS). Centraliza las claves para que
//  el desgaste y los nombres vivan en un solo lugar. Namespace "deck".
//  Se escribe SOLO por accion del usuario (calibracion, config) -> sin wear.
// ============================================================================
#pragma once
#include "../inputs/StickCalibration.h"
#include "../app/AppState.h"

namespace nvs {
void begin();

bool loadStickCal(StickCal& out);   // true si habia una calibracion valida
void saveStickCal(const StickCal& cal);

uint8_t loadBrightness(uint8_t def);   // brillo 0..100 (def si no hay)
void    saveBrightness(uint8_t pct);

bool loadUiPrefs(UiPrefs& out);
void saveUiPrefs(const UiPrefs& prefs);

// Credenciales WiFi (M1). loadWifi devuelve true si hay un SSID guardado.
bool loadWifi(char* ssid, size_t ssidLen, char* pass, size_t passLen);
void saveWifi(const char* ssid, const char* pass);

bool loadOrCreateApiToken(char* token, size_t tokenLen);
}  // namespace nvs
