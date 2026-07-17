// ============================================================================
//  Config.h - Constantes de compilacion (tiempos, identidad del dispositivo).
//  Los pines van en Pins.h; los flags de TFT/USB en platformio.ini.
// ============================================================================
#pragma once
#include <stdint.h>

namespace cfg {

// Identidad
static constexpr char DEVICE_NAME[] = "control-deck";

// --- Tiempos de entrada ---
static constexpr uint32_t DEBOUNCE_MS      = 25;   // antirrebote de pulsadores
static constexpr uint32_t LONGPRESS_MS     = 600;  // umbral de pulsacion larga
static constexpr uint32_t DOUBLE_TAP_MS    = 220;  // ventana de doble-tap (y delay del tap simple)
static constexpr uint32_t STICK_DBLTAP_MS  = 140;  // ventana corta de doble-tap del stick (tap=izq / doble=der); el izq se retrasa esto
static constexpr uint32_t CAL_COMBO_MS     = 1500; // mantener ENC_SW+STICK_SW juntos -> calibrar stick
static constexpr uint32_t MENU_TIMEOUT_MS  = 5000; // cerrar el menu solo tras inactividad
static constexpr uint32_t STICK_PERIOD_MS  = 500;  // reporte periodico del stick
static constexpr uint16_t STICK_THRESHOLD  = 120;  // movimiento minimo p/ reportar

// --- Aceleracion del encoder ---
static constexpr uint32_t ENC_ACCEL_MS   = 35;  // 2 detentes mas rapidos que esto -> acelera
static constexpr uint8_t  ENC_ACCEL_MULT = 4;   // multiplicador de pasos al girar rapido
static constexpr uint8_t  ENC_REPS_MAX   = 12;  // tope de repeticiones por evento
static constexpr bool     ENC_INVERT     = true; // rev0.8: encoder montado al reves -> invertir sentido de giro (afecta cuenta + dial)

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
static constexpr uint16_t STICK_RECENTER_MS  = 20;   // cadencia del paso +-1 de auto-recentrado (seguimiento lento del reposo real)
static constexpr uint16_t STICK_RECENTER_WARMUP = 32; // updates antes del snap inicial: deja asentar el EMA para snapear el reposo REAL (no el centro de boot)
static constexpr int16_t  STICK_HALFRANGE    = 1800; // crudo aprox del centro al tope (p/ normalizar)
static constexpr uint8_t  MOUSE_SPEED_DIV    = 10;   // divisor base (centro): normalizado(-127..127)/div = px por tick
static constexpr uint16_t MOUSE_ACCEL        = 3;    // aceleracion no-lineal (default): 0=lineal; mayor = extremos mas rapidos (el centro queda igual). Ajustable en vivo por serial +/-.
static constexpr bool     MOUSE_SWAP_XY      = false; // rev0.8: stick rotado 90 mas que antes en la carcasa -> SIN swap
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

// --- Bateria (medicion 2S Li-ion por divisor resistivo -> ADC1) ---
// DESCARTADA en el pad: GPIO9 ahora maneja el NeoPixel y la pantalla de la fuente
// ya muestra la tension de entrada (= las 2 celdas). NO poner BATTERY_ENABLED=true
// sin reasignar BAT_ADC_PIN a otro ADC1 libre (chocaria con NEOPIXEL_PIN=9).
static constexpr bool     BATTERY_ENABLED = false;  // <- descartada (ver NeoPixel)
static constexpr uint8_t  BAT_ADC_PIN     = 9;      // (en desuso; GPIO9 = NeoPixel)
static constexpr uint16_t BAT_R1_K        = 100;    // R1 (a V+ bateria), kohm
static constexpr uint16_t BAT_R2_K        = 47;     // R2 (a GND), kohm
static constexpr uint16_t BAT_FULL_MV     = 8400;   // 2S lleno (4.2V x2) -> 100%
static constexpr uint16_t BAT_EMPTY_MV    = 6000;   // 2S vacio (3.0V x2) -> 0%
static constexpr uint32_t BAT_SAMPLE_MS   = 5000;   // periodo de muestreo

// --- Tira NeoPixel (carcasa transparente) ---
// Dato en GPIO9 (ex-divisor de bateria): se descarto medir la bateria en el pad
// (la pantalla de la fuente ya muestra la tension de entrada = las 2 celdas 2S).
// Ventaja vs GPIO43: GPIO9 es un pin LIMPIO -> UART0 (43/44) queda libre para el
// Serial y el flasheo por cable con auto-reset (CH343), y sin parpadeo de boot.
// Muestra el COLOR de la capa activa (cada Layer tiene su uint16_t color).
static constexpr bool     NEOPIXEL_ENABLED = true;
static constexpr uint8_t  NEOPIXEL_PIN     = 9;      // GPIO9 (DIN, vía 330Ω). ADC1 usado como digital.
static constexpr uint16_t NEOPIXEL_COUNT   = 8;      // <- AJUSTAR a los LEDs reales de tu tira
static constexpr uint8_t  NEOPIXEL_BRIGHT  = 40;     // 0..255 (bajo: ~60mA/LED a tope; cuida el buck)

// --- Backlight TFT (PWM por LEDC, API core 2.x) ---
static constexpr uint8_t  BL_CANAL  = 0;     // canal LEDC
static constexpr uint32_t BL_FREQ   = 5000;  // Hz
static constexpr uint8_t  BL_RES    = 8;     // bits -> duty 0..255
static constexpr uint8_t  BL_BRILLO = 255;   // brillo inicial (0..255)

// --- Matriz de accion 2x5 (rev 0.9) ---
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
