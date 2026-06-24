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
static constexpr uint32_t CAL_COMBO_MS     = 1500; // mantener ENC_SW+STICK_SW juntos -> calibrar stick
static constexpr uint32_t MENU_TIMEOUT_MS  = 5000; // cerrar el menu solo tras inactividad
static constexpr uint32_t STICK_PERIOD_MS  = 500;  // reporte periodico del stick
static constexpr uint16_t STICK_THRESHOLD  = 120;  // movimiento minimo p/ reportar

// --- Aceleracion del encoder ---
static constexpr uint32_t ENC_ACCEL_MS   = 35;  // 2 detentes mas rapidos que esto -> acelera
static constexpr uint8_t  ENC_ACCEL_MULT = 4;   // multiplicador de pasos al girar rapido
static constexpr uint8_t  ENC_REPS_MAX   = 12;  // tope de repeticiones por evento

// --- Stick como mouse (M2) ---
static constexpr uint8_t  STICK_SAMPLES      = 4;    // promedio de lecturas ADC por update (anti-ruido)
static constexpr uint8_t  STICK_SETTLE_READS = 4;    // lecturas de descarte por canal (anti-crosstalk del S/H)
static constexpr uint16_t STICK_SETTLE_US    = 60;   // espera entre descartes (us) para asentar el sample-and-hold
static constexpr uint16_t STICK_DEADZONE     = 450;  // crudo: zona muerta (el ADC del S3 es ruidoso)
static constexpr uint32_t STICK_MOUSE_MS     = 25;   // periodo de emision mientras esta desviado
static constexpr int16_t  STICK_HALFRANGE    = 1800; // crudo aprox del centro al tope (p/ normalizar)
static constexpr uint8_t  MOUSE_SPEED_DIV    = 10;   // divisor: normalizado(-127..127)/div = px por tick
static constexpr bool     MOUSE_SWAP_XY      = true;  // stick montado girado 90 -> intercambia X/Y
static constexpr bool     MOUSE_INVERT_Y     = false; // invertir eje Y vertical (se aplica DESPUES del swap)
static constexpr bool     MOUSE_INVERT_X     = false; // invertir eje X horizontal (se aplica DESPUES del swap)
static constexpr uint16_t STICK_DISPLAY_DELTA = 12;  // UI: solo redibujar stick si cambia mas que esto

// --- Red / hora (M1: WiFi STA + portal cautivo + NTP) ---
static constexpr char     WIFI_AP_NAME[]   = "HIOS-PAD-setup";  // SSID del portal de config
static constexpr char     MDNS_HOST[]      = "hiospad";         // -> http://hiospad.local
static constexpr char     NTP_TZ[]         = "<-03>3";          // Argentina UTC-3 (sin DST)
static constexpr char     NTP_SERVER[]     = "pool.ntp.org";
static constexpr uint32_t WIFI_CONNECT_MS  = 12000;             // timeout de conexion STA -> portal
static constexpr uint32_t NTP_RESYNC_MS    = 3600000UL;         // re-sincronizar hora cada 1h

// --- Backlight TFT (PWM por LEDC, API core 2.x) ---
static constexpr uint8_t  BL_CANAL  = 0;     // canal LEDC
static constexpr uint32_t BL_FREQ   = 5000;  // Hz
static constexpr uint8_t  BL_RES    = 8;     // bits -> duty 0..255
static constexpr uint8_t  BL_BRILLO = 255;   // brillo inicial (0..255)

}  // namespace cfg
