// HIOS Speaker Test
// -----------------------------------------------------------------------------
// Banco de pruebas para escuchar los parlantes ANTES de armar el device.
//
// Que hace:
//   1. El ESP32 se anuncia por Bluetooth como "HIOS Speaker Test".
//   2. Emparejas el celu y reproduces cualquier cosa (Spotify, YouTube, etc).
//   3. El audio sale por I2S en estereo hacia DOS MAX98357A.
//        - Amplificador A  -> canal IZQUIERDO
//        - Amplificador B  -> canal DERECHO
//
// Importante: usar ESP32 CLASICO. El ESP32-S3 no tiene Bluetooth Classic
// (A2DP), asi que este firmware no corre ahi.
//
// Los DOS amplificadores comparten el mismo bus I2S (BCLK, LRC, DIN).
// Cada MAX98357A elige que canal reproduce por su pin SD (ver README.md).
// -----------------------------------------------------------------------------

#include <Arduino.h>
#include "BluetoothA2DPSink.h"

// --- Pines I2S (van a AMBOS MAX98357A en paralelo) ---------------------------
static const int PIN_BCLK = 26;  // BCLK  -> BCLK de los dos amps
static const int PIN_LRC  = 25;  // LRC/WS -> LRC de los dos amps
static const int PIN_DIN  = 22;  // DOUT del ESP -> DIN de los dos amps

BluetoothA2DPSink a2dp_sink;

void setup() {
  Serial.begin(115200);
  Serial.println();
  Serial.println("=== HIOS Speaker Test ===");
  Serial.println("Emparejar el celu con: HIOS Speaker Test");

  i2s_pin_config_t pins = {
    .mck_io_num   = I2S_PIN_NO_CHANGE,
    .bck_io_num   = PIN_BCLK,
    .ws_io_num    = PIN_LRC,
    .data_out_num = PIN_DIN,
    .data_in_num  = I2S_PIN_NO_CHANGE,
  };
  a2dp_sink.set_pin_config(pins);

  // Arranca el sink A2DP. El nombre es el que vas a ver en el celu.
  a2dp_sink.start("HIOS Speaker Test");

  Serial.println("Listo. Esperando conexion Bluetooth...");
}

void loop() {
  // Todo el trabajo lo hace la libreria A2DP en su propia tarea.
  delay(1000);
}
