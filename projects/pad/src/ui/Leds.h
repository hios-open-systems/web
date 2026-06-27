// ============================================================================
//  Leds.h - Tira NeoPixel (carcasa transparente). Muestra el COLOR de la capa
//  activa: cada Layer tiene su uint16_t color (RGB565) y aca lo expandimos a
//  RGB888 y pintamos toda la tira.
//
//  Pin: GPIO43 (ex-UART0 TX). Al tomarlo el RMT del NeoPixel, el Serial deja de
//  salir por hardware (no crashea). Se controla por cfg::NEOPIXEL_ENABLED.
// ============================================================================
#pragma once
#include <stdint.h>

namespace leds {

// Inicializa la tira y la deja en estado conocido (apagada). Llamar en setup()
// JUSTO DESPUES de Serial.begin() (para que el RMT gane el pin 43 de forma
// estable) y antes de usar setLayerColor().
void begin();

// Pinta toda la tira con el color de la capa (RGB565). Cachea: si el color no
// cambio, no re-emite (no toca el RMT en vano).
void setLayerColor(uint16_t rgb565);

// Apaga la tira (todos los pixeles a negro).
void off();

// Brillo global 0..255 (dimming): sigue al backlight del display (idle/nivel).
// Cachea: solo re-emite si cambia. 0 = apagada.
void setBrightness(uint8_t b);

}  // namespace leds
