// ============================================================================
//  Pins.h - Unica fuente de verdad de los pines (GPIO del ESP32-S3).
//
//  Los pines SPI de la TFT viven en platformio.ini (build flags de TFT_eSPI),
//  no aca. La guia publicada en /pinouts/pad se compara contra este archivo en
//  cada `npm run test:wiring`: si difieren, el test falla.
//
//  Agrupado por MODULO sobre los headers del DevKitC-1: cada modulo ocupa un
//  tramo seguido de UN header, asi sus cables salen juntos.
//    J1 (izquierda): 4 5 6 7 15 16 17 18 8 = teclado (matriz + ALT)
//                    9 10 11 12 13 14      = pantalla (BL + SPI)
//    J3 (derecha):   1 2 42 = stick · 41 40 39 = I2S · 38 = NeoPixel
//                    48 47 21 = encoder
//  Sin usar a proposito: 3/46/0/45 (strapping), 19/20 (USB nativo), 43/44
//  (UART0: serial + flasheo), 35-37 (PSRAM octal del N16R8: boot loop).
// ============================================================================
#pragma once
#include <stdint.h>

namespace pins {

// --- Teclado: matriz de accion 2x5 (ACC1..ACC10) -----------------------------
// Un diodo por tecla, CATODO (la raya) hacia la FILA. Sin diodos, apretar tres
// teclas en L hace aparecer una cuarta fantasma (ghosting).
// Filas: OUTPUT, en reposo HIGH; se maneja UNA a LOW por vez durante el escaneo.
// Columnas: INPUT_PULLUP; una tecla cerrada arrastra su columna a LOW.
// Indice de tecla i (0..9) -> fila = i / 5, columna = i % 5.
// O sea: ACC1..ACC5 = fila 0 (arriba), ACC6..ACC10 = fila 1 (abajo).
static constexpr uint8_t MTX_FILA[2] = {4, 5};
static constexpr uint8_t MTX_COL[5]  = {6, 7, 15, 16, 17};

// --- Teclado: los 2 ALT, DIRECTOS a GND, sin diodo, fuera de la matriz -------
// Abren capa/menu: se leen siempre, sin depender de que fila esta escaneando.
static constexpr uint8_t ALT[2] = {18, 8};   // ALT_1, ALT_2

// --- Backlight de la TFT (PWM por LEDC) ---
// El SW-PANTALLA va EN SERIE con esta linea, NO cortando el VCC del modulo:
// con el modulo sin alimentar, seguir manejando el SPI viola el abs-max del
// ILI9488 (VIN <= IOVCC + 0.3V) y le mete corriente por los diodos de ESD.
static constexpr uint8_t TFT_BL = 9;

// --- Stick analogico tipo PlayStation ---
// Alimentado a 3V3, NO a 5V: a 5V sobre-volta el ADC y acopla los ejes arriba.
// Los ejes van en ADC1 (GPIO1-10): el ADC2 no anda con WiFi/BLE prendido.
static constexpr uint8_t STICK_X  = 1;   // eje X (ADC1_0)
static constexpr uint8_t STICK_Y  = 2;   // eje Y (ADC1_1)
static constexpr uint8_t STICK_SW = 42;  // pulsador (INPUT_PULLUP)

// --- Bus I2S: los 3 pines van a AMBOS MAX98357A (bus compartido) -------------
// Lo unico distinto entre los dos amplis es su pin SD, que elige el canal y NO
// se cablea al S3: LEFT = SD a Vin; RIGHT = SD por 360k a Vin.
static constexpr uint8_t I2S_BCLK = 41;
static constexpr uint8_t I2S_LRC  = 40;   // word-select (L/R)
static constexpr uint8_t I2S_DOUT = 39;   // dato serial -> DIN de los amplis

// --- Tira NeoPixel (2 placas x 4 WS2812B encadenadas) ---
// DIN via 330 ohm en serie. En el DevKitC-1 v1.1 el LED RGB de la placa tambien
// cuelga del 38: muestra el mismo color que el primer pixel de la tira.
static constexpr uint8_t NEOPIXEL = 38;

// --- Encoder rotativo KY-040 ---
static constexpr uint8_t ENC_SW  = 48;  // pulsador (INPUT_PULLUP)
static constexpr uint8_t ENC_DT  = 47;  // canal B (interrupcion)
static constexpr uint8_t ENC_CLK = 21;  // canal A (interrupcion)

}  // namespace pins
