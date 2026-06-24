// ============================================================================
//  Calibration - Rutina modal de calibracion del stick (sweep guiado).
//  La llama el uiTask cuando appstate::mode == CALIBRATING. Dibuja en la TFT,
//  lee el ADC, calcula la StickCal, la guarda en NVS y vuelve a NORMAL.
// ============================================================================
#pragma once
#include <TFT_eSPI.h>

void runStickCalibration(TFT_eSPI& tft);
