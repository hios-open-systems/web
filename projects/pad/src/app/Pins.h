// ============================================================================
//  Pins.h - Unica fuente de verdad de los pines (GPIO del ESP32-S3).  rev 0.9
//
//  Los pines SPI de la TFT viven en platformio.ini (build flags de TFT_eSPI),
//  no aca. Restricciones: GPIO19/20 LIBRES (USB nativo); UART0 43/44 libres
//  (serial + flasheo); evitar strapping (0,3,45,46); stick en ADC1 (GPIO1-10).
//  No usables en el N16R8: 26-32 (flash) y 35-37 (PSRAM octal).
//
//  rev 0.9 vs 0.8: los 12 pulsadores directos (un GPIO cada uno) no entraban
//  junto con los parlantes. Las 10 teclas de ACCION pasan a una MATRIZ 2x5 con
//  diodos: 7 GPIO en vez de 10. Los 3 que se liberan son el bus I2S.
//    matriz 7 + ALT 2 + I2S 3 = 12  ->  sobra exactamente el GPIO3 (strapping).
//
//  Los 2 ALT quedan DIRECTOS a proposito: son los que abren capa/menu y tienen
//  que leerse siempre, sin depender de en que fila esta el escaneo.
//
//  ⚠️ Este archivo es la AUTORIDAD. La guia publicada en /pinouts se compara
//  contra el en cada `npm run test:wiring`: si difieren y la diferencia no esta
//  declarada, el test falla.
// ============================================================================
#pragma once
#include <stdint.h>

namespace pins {

// --- Matriz de accion: 10 teclas (ACC1..ACC10) en 2 filas x 5 columnas -------
// Un diodo por tecla, CATODO (la raya) hacia la FILA. Sin diodos, apretar tres
// teclas en L hace aparecer una cuarta fantasma (ghosting).
// Filas: OUTPUT, en reposo HIGH; se maneja UNA a LOW por vez durante el escaneo.
// Columnas: INPUT_PULLUP; una tecla cerrada arrastra su columna a LOW.
//
// Indice de tecla i (0..9) -> fila = i / 5, columna = i % 5.
// O sea: ACC1..ACC5 = fila 0 (arriba), ACC6..ACC10 = fila 1 (abajo).
static constexpr uint8_t MTX_FILA[2] = {15, 16};
static constexpr uint8_t MTX_COL[5]  = {18, 8, 38, 39, 47};

// GPIO8 es ADC1_7 y GPIO38 puede ser el LED RGB de la placa (DevKitC-1 v1.1):
// los dos andan igual como columna digital. El LED, si esta, parpadea con el
// escaneo — es cosmetico, su DIN es alta impedancia.

// --- Los 2 modificadores: DIRECTOS a GND, sin diodo, fuera de la matriz ------
static constexpr uint8_t ALT[2] = {17, 48};   // ALT_1, ALT_2

// --- Encoder rotativo KY-040 ---
static constexpr uint8_t ENC_CLK = 4;   // canal A (interrupcion)
static constexpr uint8_t ENC_DT  = 5;   // canal B (interrupcion)
static constexpr uint8_t ENC_SW  = 6;   // pulsador (INPUT_PULLUP)

// --- Stick analogico tipo PlayStation ---
// Alimentado a 3V3, NO a 5V: a 5V sobre-volta el ADC y acopla los ejes arriba.
static constexpr uint8_t STICK_X  = 1;  // eje X (ADC1_0)
static constexpr uint8_t STICK_Y  = 2;  // eje Y (ADC1_1)
static constexpr uint8_t STICK_SW = 7;  // pulsador (INPUT_PULLUP)

// --- Bus I2S: los 3 pines van a AMBOS MAX98357A (bus compartido) -------------
// Lo unico distinto entre los dos amplis es su pin SD, que elige el canal y NO
// se cablea al S3: LEFT = SD a Vin; RIGHT = SD por 390k a Vin (~1.0V medido).
static constexpr uint8_t I2S_BCLK = 40;
static constexpr uint8_t I2S_LRC  = 41;   // word-select (L/R)
static constexpr uint8_t I2S_DOUT = 42;   // dato serial -> DIN de los amplis

// --- Backlight de la TFT (PWM por LEDC) ---
// El SW-PANTALLA va EN SERIE con esta linea, NO cortando el VCC del modulo:
// con el modulo sin alimentar, seguir manejando el SPI viola el abs-max del
// ILI9488 (VIN <= IOVCC + 0.3V) y le mete corriente por los diodos de ESD.
static constexpr uint8_t TFT_BL = 21;

}  // namespace pins
