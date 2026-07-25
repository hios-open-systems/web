#include <Arduino.h>
#include <math.h>
#include "driver/i2s.h"

#define I2S_DOUT 25
#define I2S_BCLK 26
#define I2S_LRC  27
#define I2S_DMA_BUF_LEN 64

static void setupI2S() {
  i2s_config_t cfg = {
    .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_TX),
    .sample_rate = 44100,
    .bits_per_sample = I2S_BITS_PER_SAMPLE_16BIT,
    .channel_format = I2S_CHANNEL_FMT_RIGHT_LEFT,
    .communication_format = I2S_COMM_FORMAT_STAND_I2S,
    .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
    .dma_buf_count = 8,
    // Igual al smoke test para mantener latencia baja en alternancia L/R.
    .dma_buf_len = I2S_DMA_BUF_LEN,
    .use_apll = false,
    .tx_desc_auto_clear = true,
    // MCLK dedicado no se usa con MAX98357A en este banco de pruebas.
    .fixed_mclk = 0,
  };

  i2s_pin_config_t pins = {
    .bck_io_num = I2S_BCLK,
    .ws_io_num = I2S_LRC,
    .data_out_num = I2S_DOUT,
    .data_in_num = I2S_PIN_NO_CHANGE,
  };

  i2s_driver_install(I2S_NUM_0, &cfg, 0, nullptr);
  i2s_set_pin(I2S_NUM_0, &pins);
}

static void playChannelTone(float hz, uint32_t ms, bool left, bool right, float gain = 0.45f) {
  const int sampleRate = 44100;
  const int total = (sampleRate * ms) / 1000;
  size_t written = 0;

  for (int i = 0; i < total; ++i) {
    float t = (float)i / (float)sampleRate;
    int16_t s = (int16_t)(sin(2.0f * PI * hz * t) * 32767.0f * gain);
    int16_t frame[2] = {
      left ? s : 0,
      right ? s : 0,
    };
    i2s_write(I2S_NUM_0, frame, sizeof(frame), &written, portMAX_DELAY);
  }
  i2s_zero_dma_buffer(I2S_NUM_0);
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("[LR] Channel mapping test");
  setupI2S();
}

void loop() {
  Serial.println("[LR] LEFT only");
  playChannelTone(440.0f, 1200, true, false);
  delay(800);

  Serial.println("[LR] RIGHT only");
  playChannelTone(660.0f, 1200, false, true);
  delay(800);

  Serial.println("[LR] BOTH");
  playChannelTone(550.0f, 1200, true, true);
  delay(2000);
}
