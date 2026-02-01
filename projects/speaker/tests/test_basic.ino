/**
 * HIOS WiFi Speaker - Test Basico
 *
 * Test minimo para verificar que el hardware funciona.
 * Reproduce un tono de 440Hz por 1 segundo.
 *
 * NO necesita WiFi - solo I2S.
 *
 * Conexiones:
 * - DIN  -> GPIO25
 * - BCLK -> GPIO26
 * - LRC  -> GPIO22
 */

#include <Arduino.h>
#include "driver/i2s.h"

#define I2S_DOUT  25
#define I2S_BCLK  26
#define I2S_LRC   22

void setup() {
    Serial.begin(115200);
    delay(1000);

    Serial.println("═══════════════════════════════════════");
    Serial.println("  HIOS Speaker - Test Basico");
    Serial.println("═══════════════════════════════════════");

    // Configurar I2S
    i2s_config_t i2s_config = {
        .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_TX),
        .sample_rate = 44100,
        .bits_per_sample = I2S_BITS_PER_SAMPLE_16BIT,
        .channel_format = I2S_CHANNEL_FMT_RIGHT_LEFT,
        .communication_format = I2S_COMM_FORMAT_STAND_I2S,
        .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
        .dma_buf_count = 8,
        .dma_buf_len = 64,
        .use_apll = false,
        .tx_desc_auto_clear = true,
        .fixed_mclk = 0
    };

    i2s_pin_config_t pin_config = {
        .bck_io_num = I2S_BCLK,
        .ws_io_num = I2S_LRC,
        .data_out_num = I2S_DOUT,
        .data_in_num = I2S_PIN_NO_CHANGE
    };

    i2s_driver_install(I2S_NUM_0, &i2s_config, 0, NULL);
    i2s_set_pin(I2S_NUM_0, &pin_config);

    Serial.println("[I2S] Configurado");
    Serial.println("═══════════════════════════════════════");
}

void playTone(int freq, int duration_ms) {
    const int sampleRate = 44100;
    const int samples = (sampleRate * duration_ms) / 1000;

    int16_t sample[2];
    size_t bytesWritten;

    Serial.print("[Audio] Tono ");
    Serial.print(freq);
    Serial.print("Hz por ");
    Serial.print(duration_ms);
    Serial.println("ms");

    for (int i = 0; i < samples; i++) {
        float t = (float)i / sampleRate;
        int16_t value = (int16_t)(sin(2.0 * PI * freq * t) * 16000);
        sample[0] = value;
        sample[1] = value;
        i2s_write(I2S_NUM_0, sample, sizeof(sample), &bytesWritten, portMAX_DELAY);
    }

    i2s_zero_dma_buffer(I2S_NUM_0);
}

void loop() {
    Serial.println();
    Serial.println("[Test] Reproduciendo tono de prueba...");

    // Tono La4 (440Hz) por 1 segundo
    playTone(440, 1000);

    Serial.println("[Test] OK - Si escuchaste el tono, el hardware funciona!");
    Serial.println("[Test] Esperando 5 segundos...");
    Serial.println();

    delay(5000);
}
