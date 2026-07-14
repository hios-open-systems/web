#include "Audio.h"
#include <Arduino.h>
#include <math.h>
#include <driver/i2s.h>          // core 2.x: driver I2S legacy (la clase I2S es de core 3.x)
#include <freertos/FreeRTOS.h>
#include <freertos/queue.h>
#include <freertos/task.h>
#include "../app/Pins.h"
#include "../app/Config.h"

namespace audio {
namespace {

constexpr i2s_port_t PORT        = I2S_NUM_0;
constexpr uint32_t   SAMPLE_RATE = 16000;   // de sobra para tonos; no gasta DMA al pedo
constexpr uint16_t   CHUNK       = 128;     // frames por escritura (128 L + 128 R)
constexpr uint8_t    QUEUE_LEN   = 6;

struct ToneReq {
  uint16_t hz;
  uint16_t ms;
  uint8_t  vol;
};

bool          g_ready = false;
QueueHandle_t g_queue = nullptr;

/**
 * Renderiza un tono al bus I2S.
 *
 * La rampa de entrada/salida (`RAMP`) no es un lujo: un class-D arrancando y
 * cortando una senoidal a amplitud plena produce un "pop" bien audible en el
 * parlante. Con unos pocos ms de fade el salto desaparece.
 */
void render(const ToneReq& r) {
  const uint32_t total = (SAMPLE_RATE * (uint32_t)r.ms) / 1000;
  if (total == 0) return;

  // ~3ms de rampa a cada punta, y nunca mas de un tercio del tono (para tonos
  // muy cortos la rampa se come todo y quedaria inaudible).
  const uint32_t ramp = min<uint32_t>((SAMPLE_RATE * 3) / 1000, total / 3);

  static int16_t buf[CHUNK * 2];  // interleaved L,R
  const float  step = 2.0f * (float)M_PI * (float)r.hz / (float)SAMPLE_RATE;
  const float  amp  = (float)r.vol * 128.0f;  // 0..255 -> ~0..32640
  float        phase = 0.0f;
  uint32_t     done = 0;

  while (done < total) {
    const uint32_t n = min<uint32_t>(CHUNK, total - done);

    for (uint32_t i = 0; i < n; i++) {
      const uint32_t k = done + i;

      float env = 1.0f;
      if (ramp > 0) {
        if (k < ramp)                 env = (float)k / (float)ramp;
        else if (k >= total - ramp)   env = (float)(total - k) / (float)ramp;
      }

      // hz == 0 => silencio real (sirve como pausa entre tonos de una secuencia)
      const int16_t s = (r.hz == 0) ? 0 : (int16_t)(sinf(phase) * amp * env);
      buf[i * 2]     = s;   // L
      buf[i * 2 + 1] = s;   // R
      phase += step;
      if (phase >= 2.0f * (float)M_PI) phase -= 2.0f * (float)M_PI;
    }

    size_t written = 0;
    i2s_write(PORT, buf, n * 2 * sizeof(int16_t), &written, portMAX_DELAY);
    done += n;
  }

  // Deja el bus en silencio: si no, el DMA repite el ultimo buffer y zumba.
  i2s_zero_dma_buffer(PORT);
}

void audioTask(void*) {
  ToneReq r;
  for (;;) {
    if (xQueueReceive(g_queue, &r, portMAX_DELAY) == pdTRUE) render(r);
  }
}

}  // namespace

void begin() {
  if (!cfg::AUDIO_ENABLED) return;

  i2s_config_t conf = {};
  conf.mode                = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_TX);
  conf.sample_rate         = SAMPLE_RATE;
  conf.bits_per_sample     = I2S_BITS_PER_SAMPLE_16BIT;
  conf.channel_format      = I2S_CHANNEL_FMT_RIGHT_LEFT;   // stereo: cada ampli toma el suyo por SD
  conf.communication_format = I2S_COMM_FORMAT_STAND_I2S;
  conf.intr_alloc_flags    = 0;
  conf.dma_buf_count       = 4;
  conf.dma_buf_len         = CHUNK;
  conf.use_apll            = false;
  conf.tx_desc_auto_clear  = true;   // rellena con ceros si nos quedamos cortos: sin zumbido

  if (i2s_driver_install(PORT, &conf, 0, nullptr) != ESP_OK) {
    Serial.println("[audio] i2s_driver_install FALLO -> audio deshabilitado");
    return;
  }

  i2s_pin_config_t pin = {};
  pin.mck_io_num   = I2S_PIN_NO_CHANGE;
  pin.bck_io_num   = pins::I2S_BCLK;
  pin.ws_io_num    = pins::I2S_LRC;
  pin.data_out_num = pins::I2S_DOUT;
  pin.data_in_num  = I2S_PIN_NO_CHANGE;   // solo TX

  if (i2s_set_pin(PORT, &pin) != ESP_OK) {
    Serial.println("[audio] i2s_set_pin FALLO -> audio deshabilitado");
    i2s_driver_uninstall(PORT);
    return;
  }

  i2s_zero_dma_buffer(PORT);

  g_queue = xQueueCreate(QUEUE_LEN, sizeof(ToneReq));
  if (!g_queue) {
    i2s_driver_uninstall(PORT);
    Serial.println("[audio] sin RAM para la cola -> audio deshabilitado");
    return;
  }

  // Core 0 (con ui y net). El inputTask vive en el core 1 y no lo queremos
  // compitiendo con el render. Prioridad 3: por encima de ui(2)/net(1) para que
  // un tono no salga entrecortado, pero los tonos son cortos y i2s_write cede
  // la CPU esperando al DMA, asi que no mata a la UI.
  xTaskCreatePinnedToCore(audioTask, "audio", 4096, nullptr, 3, nullptr, 0);

  g_ready = true;
  Serial.printf("[audio] I2S ok (BCLK=%u LRC=%u DOUT=%u @%luHz)\n",
                pins::I2S_BCLK, pins::I2S_LRC, pins::I2S_DOUT, (unsigned long)SAMPLE_RATE);
}

bool ready() { return g_ready; }

void tone(uint16_t hz, uint16_t ms, uint8_t vol) {
  if (!g_ready) return;
  const ToneReq r{hz, ms, vol};
  // Sin espera: si la cola esta llena preferimos perder el click antes que
  // frenar al que llama (que puede ser el inputTask).
  xQueueSend(g_queue, &r, 0);
}

void click() { tone(cfg::AUDIO_CLICK_HZ, cfg::AUDIO_CLICK_MS, cfg::AUDIO_VOL); }

}  // namespace audio
