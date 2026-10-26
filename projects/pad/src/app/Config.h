// ============================================================================
//  Config.h - Constantes de compilacion (tiempos, red, umbrales).
//  Los pines van en Pins.h; los flags de TFT/USB en platformio.ini.
// ============================================================================
#pragma once
#include <stdint.h>
#include "Pins.h"

namespace cfg {

// --- Tiempos de entrada ---
static constexpr uint32_t DEBOUNCE_MS      = 25;   // antirrebote de pulsadores
static constexpr uint32_t LONGPRESS_MS     = 600;  // umbral de pulsacion larga
static constexpr uint32_t DOUBLE_TAP_MS    = 220;  // ventana de doble-tap (y delay del tap simple)
static constexpr uint32_t STICK_DBLTAP_MS  = 140;  // ventana corta de doble-tap del stick (tap=izq / doble=der); el izq se retrasa esto
static constexpr uint32_t CAL_COMBO_MS     = 1500; // mantener ENC_SW+STICK_SW juntos -> calibrar stick
static constexpr uint32_t MENU_TIMEOUT_MS  = 5000; // cerrar el menu solo tras inactividad

// --- Aceleracion del encoder ---
static constexpr uint32_t ENC_ACCEL_MS   = 35;  // 2 detentes mas rapidos que esto -> acelera
static constexpr uint8_t  ENC_ACCEL_MULT = 4;   // multiplicador de pasos al girar rapido
static constexpr uint8_t  ENC_REPS_MAX   = 12;  // tope de repeticiones por evento
static constexpr bool     ENC_INVERT     = true; // encoder montado al reves -> invertir sentido de giro (afecta cuenta + dial)

// --- ALT momentaneos (hold -> capa referenciada por nombre, con linger) ---
// Mantener ALT1/ALT2 salta a su capa; al soltar, queda ALT_LINGER_MS mas (el
// "seguro" anti-ripple / falsos releases de los botones sin tacto). Las capas
// deben existir en DefaultConfig con estos nombres (si no, el ALT no hace nada).
static constexpr char     ALT1_LAYER[]   = "Launcher";
static constexpr char     ALT2_LAYER[]   = "Macros";
static constexpr uint32_t ALT_LINGER_MS  = 600;   // ventana de gracia tras soltar

// --- Stick como mouse (M2) ---
static constexpr uint8_t  STICK_SAMPLES      = 4;    // promedio de lecturas ADC por update (anti-ruido)
static constexpr uint8_t  STICK_SETTLE_READS = 8;    // lecturas de descarte por canal (anti-crosstalk del S/H)
static constexpr uint16_t STICK_SETTLE_US    = 60;   // espera entre descartes (us)
static constexpr uint16_t STICK_DEADZONE     = 450;  // crudo: zona muerta (el ADC del S3 es ruidoso)
static constexpr uint32_t STICK_MOUSE_MS     = 25;   // periodo de emision mientras esta desviado
static constexpr uint16_t STICK_REST_BAND    = 500;  // crudo: banda alrededor del centro donde el auto-recentrado adapta (fuera = empuje real, no toca)
static constexpr uint16_t STICK_RECENTER_MS  = 20;   // cadencia del paso +-1 DENTRO de la zona muerta (ahi no hay empuje que robar)
// Entre la zona muerta y la banda puede ser reposo corrido O un empuje suave sostenido:
// no se distinguen. Se adapta igual (si no, un reposo que cae fuera de la zona muerta
// deja el puntero derivando para siempre) pero MUY lento, para no comerse el empuje.
// 1000ms = 1 crudo/s: un empuje de 300 crudos tardaria minutos en anularse (antes ~6s).
static constexpr uint16_t STICK_RECENTER_SLOW_MS = 1000;
static constexpr uint16_t STICK_RECENTER_WARMUP = 32; // updates antes del snap inicial: deja asentar el EMA para snapear el reposo REAL (no el centro de boot)
static constexpr int16_t  STICK_HALFRANGE    = 1800; // crudo aprox del centro al tope (p/ normalizar)
static constexpr uint8_t  MOUSE_SPEED_DIV    = 10;   // divisor base (centro): normalizado(-127..127)/div = px por tick
static constexpr uint16_t MOUSE_ACCEL        = 3;    // aceleracion no-lineal (default): 0=lineal; mayor = extremos mas rapidos (el centro queda igual). Ajustable en vivo por serial +/-.
static constexpr bool     MOUSE_SWAP_XY      = false; // orientacion del stick en la carcasa: sin swap de ejes
static constexpr bool     MOUSE_INVERT_Y     = true;  // invertir eje Y vertical (se aplica DESPUES del swap)
static constexpr bool     MOUSE_INVERT_X     = true;  // invertir eje X horizontal (se aplica DESPUES del swap)
static constexpr uint16_t STICK_DISPLAY_DELTA = 12;  // UI: solo redibujar stick si cambia mas que esto

// Curva de aceleracion del stick: px por tick a partir del eje normalizado (-127..127).
// Cerca del centro ~ n/MOUSE_SPEED_DIV (preciso, igual que antes); en el extremo sube
// hasta ~(1+MOUSE_ACCEL)*n/MOUSE_SPEED_DIV (rapido, para cruzar pantallas). Tope HID +-127.
inline int mouseAccel(int n, int accel) {
  long t2  = (long)n * n * 256 / (127 * 127);          // |n|^2 normalizado a 0..256 (la curva)
  long g   = 256 + (long)accel * t2;                   // ganancia*256: 256 en el centro -> 256*(1+accel) en el extremo
  long out = (long)n * g / (256L * MOUSE_SPEED_DIV);
  return out > 127 ? 127 : (out < -127 ? -127 : (int)out);
}

// --- Red / hora (M1: WiFi STA + portal cautivo + NTP) ---
static constexpr char     WIFI_AP_NAME[]   = "HIOS-PAD-setup";  // SSID del portal de config
static constexpr char     MDNS_HOST[]      = "hiospad";         // -> http://hiospad.local
static constexpr char     NTP_TZ[]         = "<-03>3";          // Argentina UTC-3 (sin DST)
static constexpr char     NTP_SERVER[]     = "pool.ntp.org";
static constexpr uint32_t WIFI_CONNECT_MS  = 12000;             // timeout de conexion STA -> portal
static constexpr uint32_t NTP_RESYNC_MS    = 3600000UL;         // re-sincronizar hora cada 1h

// --- Feedback real (Fase 1: companion -> POST /api/state) ---
static constexpr uint32_t STATE_FRESH_MS   = 5000;             // POST mas viejo que esto -> "sin companion". Con poll 1500ms tolera ~2-3 polls perdidos sin grisar el "live".

// --- Tira NeoPixel (carcasa transparente) ---
// Muestra el COLOR de la capa activa (cada Layer tiene su uint16_t color).
// La bateria no se mide en el pad: su tension se lee en la pantalla de la fuente.
static constexpr bool     NEOPIXEL_ENABLED = true;
static constexpr uint8_t  NEOPIXEL_PIN     = pins::NEOPIXEL;  // DIN via 330 ohm. El pin vive en Pins.h.
static constexpr uint16_t NEOPIXEL_COUNT   = 8;      // 2 placas de 4 LEDs encadenadas (DOUT de la A -> DIN de la B)
static constexpr uint8_t  NEOPIXEL_BRIGHT  = 40;     // 0..255 (bajo: ~60mA/LED a tope; cuida el buck)

// ZONAS: en cuantos tramos direccionables por separado se parte la tira.
// Encadenar las 2 placas en un pin NO las hace dependientes: cada WS2812B tiene
// su propio controlador y se come los primeros 24 bits que le llegan, asi que los
// 8 pixeles se pintan de a uno. Un segundo GPIO de datos no compraria nada.
// 8 px / 2 zonas = 4 px por zona = una zona por placa. Si algun dia encadenas mas
// LEDs, subi COUNT y ZONES juntos: la zona z va de z*COUNT/ZONES a (z+1)*COUNT/ZONES.
static constexpr uint8_t  NEOPIXEL_ZONES   = 2;      // 1 = tira entera de un color (comportamiento viejo)

// --- Backlight TFT (PWM por LEDC, API core 2.x) ---
static constexpr uint8_t  BL_CANAL  = 0;     // canal LEDC
static constexpr uint32_t BL_FREQ   = 5000;  // Hz
static constexpr uint8_t  BL_RES    = 8;     // bits -> duty 0..255

// --- Matriz de accion 2x5 ---
// Espera despues de manejar una fila a LOW, antes de leer las columnas. La
// columna vuelve a HIGH por el pullup INTERNO (~45k), que es debil: sin este
// settle, una tecla de la fila anterior deja la columna baja y se lee como
// pulsada la de esta fila. 30us es ~10x el RC tipico; el escaneo entero cuesta
// 2 filas x 30us = 60us por vuelta, o sea nada.
static constexpr uint32_t MTX_SETTLE_US = 30;

// --- Audio I2S (2x MAX98357A, bus compartido) ---
// Poner en false si todavia no soldaste los amplis: sin ellos el driver instala
// igual y no molesta, pero asi te ahorras la task y el DMA.
static constexpr bool     AUDIO_ENABLED  = true;
static constexpr uint8_t  AUDIO_VOL      = 90;    // 0..255. Ojo con el buck (dos amplis pican).
static constexpr uint16_t AUDIO_CLICK_HZ = 2200;  // feedback de tecla: corto y agudo
static constexpr uint16_t AUDIO_CLICK_MS = 18;

}  // namespace cfg
