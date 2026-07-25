#include <Arduino.h>
#include <math.h>
#include "driver/i2s.h"

#define I2S_DOUT 25
#define I2S_BCLK 26
#define I2S_LRC  27

static void setupI2S() {
  i2s_config_t cfg = {
    .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_TX),
    .sample_rate = 44100,
    .bits_per_sample = I2S_BITS_PER_SAMPLE_16BIT,
    .channel_format = I2S_CHANNEL_FMT_RIGHT_LEFT,
    .communication_format = I2S_COMM_FORMAT_STAND_I2S,
    .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
    .dma_buf_count = 8,
    .dma_buf_len = 128,
    .use_apll = false,
    .tx_desc_auto_clear = true,
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

static void playStereo(uint32_t ms, float gain = 0.35f) {
  const int sampleRate = 44100;
  const int total = (sampleRate * ms) / 1000;
  size_t written = 0;

  for (int i = 0; i < total; ++i) {
    float t = (float)i / (float)sampleRate;
    int16_t l = (int16_t)(sin(2.0f * PI * 330.0f * t) * 32767.0f * gain);
    int16_t r = (int16_t)(sin(2.0f * PI * 554.37f * t) * 32767.0f * gain);
    int16_t frame[2] = {l, r};
    i2s_write(I2S_NUM_0, frame, sizeof(frame), &written, portMAX_DELAY);
  }

  i2s_zero_dma_buffer(I2S_NUM_0);
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("[STABILITY] Stereo endurance test");
  setupI2S();
}

void loop() {
  static uint32_t cycle = 0;
  cycle++;
  Serial.printf("[STABILITY] cycle=%lu start (10s playback)\n", (unsigned long)cycle);
  playStereo(10000);
  Serial.println("[STABILITY] cool-down 2s");
  delay(2000);
}
