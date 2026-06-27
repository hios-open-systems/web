// ============================================================================
//  Pins.h - Unica fuente de verdad de los pines (GPIO del ESP32-S3).
//  Los pines SPI de la TFT viven en platformio.ini (build flags de TFT_eSPI),
//  no aca. Restricciones: GPIO19/20 LIBRES (USB nativo); evitar strapping
//  (0,3,45,46); stick en ADC1 (GPIO1-10).
// ============================================================================
#pragma once
#include <stdint.h>

namespace pins {

// --- 12 pulsadores mecanicos NA, comun a GND, activos en BAJO (INPUT_PULLUP) ---
// 10 de accion (ACC1..10) + 2 ALT. Orden = InputId BTN_1..BTN_10, ALT_1, ALT_2.
static constexpr uint8_t BOTON[12] = {15, 16, 17, 18, 8, 38, 39, 40, 41, 42, 47, 48};

// --- Encoder rotativo KY-040 ---
static constexpr uint8_t ENC_CLK = 4;   // canal A (interrupcion)
static constexpr uint8_t ENC_DT  = 5;   // canal B (interrupcion)
static constexpr uint8_t ENC_SW  = 6;   // pulsador (INPUT_PULLUP)

// --- Stick analogico tipo PlayStation ---
static constexpr uint8_t STICK_X  = 1;  // eje X (ADC1)
static constexpr uint8_t STICK_Y  = 2;  // eje Y (ADC1)
static constexpr uint8_t STICK_SW = 7;  // pulsador (INPUT_PULLUP)

// --- Backlight de la TFT (PWM por software) ---
static constexpr uint8_t TFT_BL = 21;

}  // namespace pins
