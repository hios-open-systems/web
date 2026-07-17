// ============================================================================
//  Leds.h - Tira NeoPixel (carcasa transparente). Muestra el COLOR de la capa
//  activa: cada Layer tiene su uint16_t color (RGB565) y aca lo expandimos a
//  RGB888 y pintamos la tira.
//
//  Pin: GPIO9 (ex-divisor de batería, cfg::NEOPIXEL_PIN). Pin limpio -> UART0
//  (43/44) queda libre para el Serial y el flasheo. Se controla por cfg::NEOPIXEL_ENABLED.
//
//  ZONAS: la tira son 2 placas de 4 LEDs encadenadas en UN pin, y encadenar no
//  las hace dependientes (cada WS2812B tiene su controlador). Se parte en
//  cfg::NEOPIXEL_ZONES tramos que se pintan por separado -> efectos por zona sin
//  gastar un segundo GPIO. setLayerColor() sigue pintando TODO, como siempre.
// ============================================================================
#pragma once
#include <stdint.h>

namespace leds {

// Inicializa la tira y la deja en estado conocido (apagada). Llamar en setup()
// JUSTO DESPUES de Serial.begin() (para que el RMT gane el pin 43 de forma
// estable) y antes de usar setLayerColor().
void begin();

// Pinta TODA la tira con el color de la capa (RGB565): pisa las zonas. Cachea: si
// ya estaba entera de ese color, no re-emite (no toca el RMT en vano).
void setLayerColor(uint16_t rgb565);

// Cuantas zonas hay (= cfg::NEOPIXEL_ZONES). Con 8 px y 2 zonas, una por placa.
uint8_t zoneCount();

// Pinta UNA zona (0..zoneCount()-1) sin tocar las otras -> efectos por zona.
// Fuera de rango es no-op. Cachea igual que setLayerColor.
// Emite la tira entera igual (el protocolo no permite direccionar un tramo
// suelto: son 24 bits por pixel en cadena), pero eso son ~240us para 8 px.
void setZoneColor(uint8_t zone, uint16_t rgb565);

// Primer pixel de la zona (util para animar de a un LED dentro de un tramo).
uint16_t zoneBegin(uint8_t zone);
// Un pasado-el-ultimo pixel de la zona: la zona es [zoneBegin, zoneEnd).
uint16_t zoneEnd(uint8_t zone);

// Apaga la tira (todos los pixeles a negro).
void off();

// Brillo global 0..255 (dimming): sigue al backlight del display (idle/nivel).
// Cachea: solo re-emite si cambia. 0 = apagada.
void setBrightness(uint8_t b);

}  // namespace leds
