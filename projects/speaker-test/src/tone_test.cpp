// HIOS Speaker Test - GENERADOR DE TONO (sin Bluetooth)
// -----------------------------------------------------------------------------
// Sirve para AISLAR el problema. Este firmware NO usa Bluetooth: genera un
// tono por I2S directamente hacia los MAX98357A, en bucle.
//
//   - Si SUENA  -> el I2S, los amplis, los parlantes y la fuente estan OK.
//                  El problema entonces es el Bluetooth (emparejar / audio).
//   - Si NO suena -> es hardware: cableado, pin SD, parlante o alimentacion.
//
// Ciclo de beeps (se repite):
//   1. Tono AGUDO (1000 Hz) solo en el CANAL 1  (slot izquierdo del I2S)
//   2. Tono MEDIO  (600 Hz) solo en el CANAL 2  (slot derecho del I2S)
//   3. Tono GRAVE  (440 Hz) en AMBOS canales
//
// Anota que parlante suena en cada beep: asi verificas tambien la seleccion
// L/R de cada amp (pin SD). Si los dos amps suenan igual en todos los beeps,
// es que estan puestos en el mismo canal (SD sin los resistores L/R).
//
// IMPORTANTE para que suene: el pin SD de cada amp NO puede estar en GND
// (eso apaga el chip). Para el test, conecta SD a Vin (directo = encendido).
// -----------------------------------------------------------------------------

#include <Arduino.h>
#include <math.h>
#include "driver/i2s.h"

// Mismos pines que el firmware A2DP (van a AMBOS amps en paralelo)
static const int PIN_BCLK = 26;
static const int PIN_LRC  = 25;
static const int PIN_DIN  = 22;

static const int   SAMPLE_RATE = 44100;
static const int   AMPLITUDE   = 6000;   // de 32767; volumen moderado
static const i2s_port_t I2S_PORT = I2S_NUM_0;

static void i2sInit() {
  i2s_config_t cfg = {
    .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_TX),
    .sample_rate = SAMPLE_RATE,
    .bits_per_sample = I2S_BITS_PER_SAMPLE_16BIT,
    .channel_format = I2S_CHANNEL_FMT_RIGHT_LEFT,   // estereo
    .communication_format = I2S_COMM_FORMAT_STAND_I2S,
    .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
    .dma_buf_count = 8,
    .dma_buf_len = 256,
    .use_apll = false,
    .tx_desc_auto_clear = true,
    .fixed_mclk = 0,
  };
  i2s_pin_config_t pins = {
    .bck_io_num   = PIN_BCLK,
    .ws_io_num    = PIN_LRC,
    .data_out_num = PIN_DIN,
    .data_in_num  = I2S_PIN_NO_CHANGE,
  };
  i2s_driver_install(I2S_PORT, &cfg, 0, NULL);
  i2s_set_pin(I2S_PORT, &pins);
  i2s_zero_dma_buffer(I2S_PORT);
}

// Reproduce un tono 'ms' milisegundos. 'ch1'/'ch2' encienden cada slot I2S.
static void playTone(float freq, int ms, bool ch1, bool ch2) {
  static int16_t buf[256 * 2];       // interleaved: [ch1, ch2, ch1, ch2, ...]
  const int frames = 256;
  int totalFrames = (SAMPLE_RATE * ms) / 1000;
  double phase = 0.0;
  double inc = 2.0 * M_PI * freq / SAMPLE_RATE;

  int done = 0;
  while (done < totalFrames) {
    for (int i = 0; i < frames; i++) {
      int16_t s = (int16_t)(sin(phase) * AMPLITUDE);
      phase += inc;
      if (phase > 2.0 * M_PI) phase -= 2.0 * M_PI;
      buf[i * 2 + 0] = ch1 ? s : 0;
      buf[i * 2 + 1] = ch2 ? s : 0;
    }
    size_t written;
    i2s_write(I2S_PORT, buf, sizeof(buf), &written, portMAX_DELAY);
    done += frames;
  }
}

void setup() {
  Serial.begin(115200);
  Serial.println();
  Serial.println("=== HIOS Speaker Test - TONO (sin BT) ===");
  i2sInit();
  Serial.println("I2S listo. Emitiendo beeps en bucle...");
}

void loop() {
  Serial.println("BEEP agudo -> CANAL 1 (slot izq)");
  playTone(1000, 400, true, false);
  delay(500);

  Serial.println("BEEP medio -> CANAL 2 (slot der)");
  playTone(600, 400, false, true);
  delay(500);

  Serial.println("BEEP grave -> AMBOS canales");
  playTone(440, 400, true, true);
  delay(1200);
}
