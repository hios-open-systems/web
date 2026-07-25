// HIOS Speaker Test - CHIPTUNE (sin Bluetooth)
// -----------------------------------------------------------------------------
// Reproduce una melodia original estilo retro (SNES/NES-ish) por I2S, en bucle.
// Sirve para escuchar como suena musica de verdad en los parlantes, no solo
// un beep. Tres voces mezcladas:
//   - LEAD:  onda de pulso 25% (ese sonido "cuadrado" clasico)
//   - BAJO:  onda triangular (calida)
//   - PERC:  rafagas cortas de ruido (bombo en el tiempo, hi-hat en el offbeat)
//
// Sale por AMBOS canales (los dos parlantes). Sin Bluetooth.
// -----------------------------------------------------------------------------

#include <Arduino.h>
#include <math.h>
#include "driver/i2s.h"

static const int PIN_BCLK = 26;
static const int PIN_LRC  = 25;
static const int PIN_DIN  = 22;

static const int SAMPLE_RATE = 44100;
static const i2s_port_t I2S_PORT = I2S_NUM_0;

// --- Notas (Hz) ---
#define R  0.0f
static const float NG4=392.00f, NB4=493.88f, NC5=523.25f, ND5=587.33f, NE5=659.25f,
                   NF5=698.46f, NG5=783.99f, NA5=880.00f;
static const float NC3=130.81f, NF2=87.31f, NG2=98.00f, NA2=110.00f;

static const int   STEPS   = 32;
static const int   STEP_MS = 140;   // duracion de cada corchea

// Melodia (I - vi - IV - V : Do Lam Fa Sol)
static const float lead[STEPS] = {
  NG5,NE5,NC5,NE5,  NG5,NA5,NG5,NE5,   NF5,ND5,NB4,ND5,  NF5,NG5,NF5,ND5,
  NE5,NC5,NG4,NC5,  NE5,NF5,NE5,NC5,   ND5,NB4,NG4,NB4,  ND5,NC5,R ,R
};
static const float bass[STEPS] = {
  NC3,NC3,NC3,NC3,  NA2,NA2,NA2,NA2,   NF2,NF2,NF2,NF2,  NG2,NG2,NG2,NG2,
  NC3,NC3,NC3,NC3,  NF2,NF2,NF2,NF2,   NG2,NG2,NG2,NG2,  NC3,NC3,NC3,NC3
};

static float phLead = 0.0f, phBass = 0.0f;

static void i2sInit() {
  i2s_config_t cfg = {
    .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_TX),
    .sample_rate = SAMPLE_RATE,
    .bits_per_sample = I2S_BITS_PER_SAMPLE_16BIT,
    .channel_format = I2S_CHANNEL_FMT_RIGHT_LEFT,
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

static void playStep(float fLead, float fBass, int stepIdx) {
  static int16_t buf[512];           // 256 frames estereo
  int nSamples = SAMPLE_RATE * STEP_MS / 1000;
  int idx = 0;

  for (int i = 0; i < nSamples; i++) {
    float prog = (float)i / nSamples;              // 0..1 dentro del step
    float v = 0.0f;

    // LEAD: pulso 25% con envolvente plucky
    if (fLead > 0.0f) {
      phLead += fLead / SAMPLE_RATE;
      if (phLead >= 1.0f) phLead -= 1.0f;
      float env = expf(-3.5f * prog);
      v += ((phLead < 0.25f) ? 0.5f : -0.5f) * env;
    }
    // BAJO: triangular con sustain suave
    if (fBass > 0.0f) {
      phBass += fBass / SAMPLE_RATE;
      if (phBass >= 1.0f) phBass -= 1.0f;
      float t = phBass;
      float tri = (t < 0.5f) ? (4.0f * t - 1.0f) : (3.0f - 4.0f * t);
      float env = 0.6f + 0.4f * expf(-2.0f * prog);
      v += tri * 0.5f * env;
    }
    // PERC: bombo en el beat, hi-hat en el offbeat
    int msIn = (int)(prog * STEP_MS);
    if ((stepIdx % 4) == 0 && msIn < 45) {          // bombo (ruido grave corto)
      float e = 1.0f - (msIn / 45.0f);
      v += (random(-1000, 1000) / 1000.0f) * 0.45f * e * e;
    } else if ((stepIdx % 4) == 2 && msIn < 18) {   // hi-hat (ruido agudo cortito)
      float e = 1.0f - (msIn / 18.0f);
      v += (random(-1000, 1000) / 1000.0f) * 0.25f * e;
    }

    if (v > 1.0f) v = 1.0f;
    if (v < -1.0f) v = -1.0f;
    int16_t s = (int16_t)(v * 11000.0f);

    buf[idx++] = s;   // canal 1
    buf[idx++] = s;   // canal 2
    if (idx >= 512) {
      size_t w; i2s_write(I2S_PORT, buf, idx * sizeof(int16_t), &w, portMAX_DELAY);
      idx = 0;
    }
  }
  if (idx > 0) {
    size_t w; i2s_write(I2S_PORT, buf, idx * sizeof(int16_t), &w, portMAX_DELAY);
  }
}

void setup() {
  Serial.begin(115200);
  Serial.println();
  Serial.println("=== HIOS Speaker Test - CHIPTUNE (sin BT) ===");
  i2sInit();
  Serial.println("Reproduciendo melodia en bucle...");
}

void loop() {
  for (int s = 0; s < STEPS; s++) {
    playStep(lead[s], bass[s], s);
  }
}
