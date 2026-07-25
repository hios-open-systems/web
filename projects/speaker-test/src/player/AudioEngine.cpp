#include "AudioEngine.h"
#include <Arduino.h>
#include "driver/i2s.h"
#include "Sequencer.h"

namespace audio {

namespace {

// Mismos pines que song.cpp / tone_test.cpp (van a AMBOS MAX98357A)
constexpr int PIN_BCLK = 26;
constexpr int PIN_LRC  = 25;
constexpr int PIN_DIN  = 22;
constexpr i2s_port_t I2S_PORT = I2S_NUM_0;
constexpr int FRAMES = 256;  // cuadros por bloque de render

volatile const DeviceSong* g_pending = nullptr;
volatile bool g_swapReq = false;
int16_t g_buf[FRAMES * 2];

void i2sInit() {
  i2s_config_t cfg = {};
  cfg.mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_TX);
  cfg.sample_rate = SAMPLE_RATE;
  cfg.bits_per_sample = I2S_BITS_PER_SAMPLE_16BIT;
  cfg.channel_format = I2S_CHANNEL_FMT_RIGHT_LEFT;
  cfg.communication_format = I2S_COMM_FORMAT_STAND_I2S;
  cfg.intr_alloc_flags = ESP_INTR_FLAG_LEVEL1;
  cfg.dma_buf_count = 8;
  cfg.dma_buf_len = 256;
  cfg.use_apll = false;
  cfg.tx_desc_auto_clear = true;
  cfg.fixed_mclk = 0;

  i2s_pin_config_t pins = {};
  pins.mck_io_num = I2S_PIN_NO_CHANGE;
  pins.bck_io_num = PIN_BCLK;
  pins.ws_io_num = PIN_LRC;
  pins.data_out_num = PIN_DIN;
  pins.data_in_num = I2S_PIN_NO_CHANGE;

  i2s_driver_install(I2S_PORT, &cfg, 0, nullptr);
  i2s_set_pin(I2S_PORT, &pins);
  i2s_zero_dma_buffer(I2S_PORT);
}

void audioTask(void*) {
  for (;;) {
    if (g_swapReq) {
      seq::setSong((const DeviceSong*)g_pending);
      g_swapReq = false;
    }
    seq::renderBlock(g_buf, FRAMES);
    size_t written;
    i2s_write(I2S_PORT, g_buf, sizeof(g_buf), &written, portMAX_DELAY);
  }
}

}  // namespace

void begin() {
  i2sInit();
  xTaskCreatePinnedToCore(audioTask, "audio", 4096, nullptr, 5, nullptr, 1);
}

void swap(const DeviceSong* song) {
  g_pending = song;
  g_swapReq = true;
}

void play() { seq::setPlaying(true); }
void stop() { seq::setPlaying(false); }
bool playing() { return seq::isPlaying(); }
uint8_t voices() { return seq::activeVoices(); }

}  // namespace audio
