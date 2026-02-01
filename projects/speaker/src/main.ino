/**
 * HIOS WiFi Speaker - Firmware Principal
 *
 * Parlante WiFi con ESP32, MAX98357 I2S y control web.
 *
 * Hardware:
 * - ESP32 DevKit V1
 * - MAX98357 I2S Amplifier
 * - Speaker 4ohm 3W
 * - LM2596 Power Supply
 * - 2x 18650 Batteries
 *
 * Conexiones I2S:
 * - DIN  -> GPIO25
 * - BCLK -> GPIO26
 * - LRC  -> GPIO22
 *
 * GitHub: https://github.com/hios-open-systems/web/tree/main/projects/speaker
 * License: MIT
 */

#include <Arduino.h>
#include <WiFi.h>
#include <WebServer.h>
#include <ESPmDNS.h>
#include "driver/i2s.h"

// ============================================
// CONFIGURACION - Modificar segun tu red
// ============================================

const char* WIFI_SSID = "TU_RED_WIFI";
const char* WIFI_PASS = "TU_PASSWORD";
const char* DEVICE_NAME = "HIOS-Speaker";

// ============================================
// PINES I2S
// ============================================

#define I2S_DOUT  25  // DIN del MAX98357
#define I2S_BCLK  26  // BCLK
#define I2S_LRC   22  // LRC (Word Select)

// ============================================
// VARIABLES GLOBALES
// ============================================

WebServer server(80);
bool audioPlaying = false;

// ============================================
// CONFIGURACION I2S
// ============================================

void setupI2S() {
    Serial.println("[I2S] Configurando...");

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
    i2s_zero_dma_buffer(I2S_NUM_0);

    Serial.println("[I2S] OK");
}

// ============================================
// WIFI
// ============================================

void setupWiFi() {
    Serial.println("[WiFi] Conectando...");
    Serial.print("[WiFi] SSID: ");
    Serial.println(WIFI_SSID);

    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASS);

    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 30) {
        delay(500);
        Serial.print(".");
        attempts++;
    }

    if (WiFi.status() == WL_CONNECTED) {
        Serial.println();
        Serial.print("[WiFi] Conectado! IP: ");
        Serial.println(WiFi.localIP());

        if (MDNS.begin(DEVICE_NAME)) {
            Serial.print("[mDNS] http://");
            Serial.print(DEVICE_NAME);
            Serial.println(".local");
        }
    } else {
        Serial.println();
        Serial.println("[WiFi] Error de conexion");
    }
}

// ============================================
// WEB SERVER
// ============================================

void handleRoot() {
    String html = "<!DOCTYPE html><html><head>";
    html += "<meta name='viewport' content='width=device-width, initial-scale=1'>";
    html += "<title>HIOS Speaker</title>";
    html += "<style>";
    html += "body{font-family:system-ui;max-width:600px;margin:0 auto;padding:20px;background:#1a1a2e;color:#fff}";
    html += "h1{color:#f59e0b}";
    html += ".btn{background:#f59e0b;color:#000;border:none;padding:15px 30px;font-size:18px;border-radius:8px;cursor:pointer;margin:10px}";
    html += ".btn:hover{background:#d97706}";
    html += ".status{padding:20px;background:#16213e;border-radius:8px;margin:20px 0}";
    html += "</style></head><body>";
    html += "<h1>HIOS WiFi Speaker</h1>";
    html += "<div class='status'>";
    html += "<p><strong>Estado:</strong> " + String(audioPlaying ? "Reproduciendo" : "Idle") + "</p>";
    html += "<p><strong>IP:</strong> " + WiFi.localIP().toString() + "</p>";
    html += "<p><strong>RSSI:</strong> " + String(WiFi.RSSI()) + " dBm</p>";
    html += "</div>";
    html += "<button class='btn' onclick=\"fetch('/test')\">Test Audio</button>";
    html += "<button class='btn' onclick=\"fetch('/stop')\">Stop</button>";
    html += "<p style='margin-top:40px;opacity:0.5'>HIOS Open Systems</p>";
    html += "</body></html>";

    server.send(200, "text/html", html);
}

void handleTest() {
    Serial.println("[Audio] Test tone...");
    playTestTone();
    server.send(200, "text/plain", "OK");
}

void handleStop() {
    Serial.println("[Audio] Stop");
    i2s_zero_dma_buffer(I2S_NUM_0);
    audioPlaying = false;
    server.send(200, "text/plain", "OK");
}

void setupWebServer() {
    server.on("/", handleRoot);
    server.on("/test", handleTest);
    server.on("/stop", handleStop);
    server.begin();
    Serial.println("[Web] Servidor iniciado");
}

// ============================================
// AUDIO
// ============================================

void playTestTone() {
    audioPlaying = true;

    const int duration = 500; // ms
    const int freq = 440; // Hz (La4)
    const int sampleRate = 44100;
    const int samples = (sampleRate * duration) / 1000;

    int16_t sample[2];
    size_t bytesWritten;

    for (int i = 0; i < samples; i++) {
        float t = (float)i / sampleRate;
        int16_t value = (int16_t)(sin(2.0 * PI * freq * t) * 16000);
        sample[0] = value; // Left
        sample[1] = value; // Right
        i2s_write(I2S_NUM_0, sample, sizeof(sample), &bytesWritten, portMAX_DELAY);
    }

    i2s_zero_dma_buffer(I2S_NUM_0);
    audioPlaying = false;
}

// ============================================
// SETUP
// ============================================

void setup() {
    Serial.begin(115200);
    delay(1000);

    Serial.println();
    Serial.println("═══════════════════════════════════════════════════════════");
    Serial.println("              HIOS WiFi Speaker");
    Serial.println("═══════════════════════════════════════════════════════════");
    Serial.println("Dispositivo: " + String(DEVICE_NAME));
    Serial.println("Pines I2S: DOUT=" + String(I2S_DOUT) + ", BCLK=" + String(I2S_BCLK) + ", LRC=" + String(I2S_LRC));
    Serial.println("═══════════════════════════════════════════════════════════");

    setupI2S();
    setupWiFi();
    setupWebServer();

    Serial.println("═══════════════════════════════════════════════════════════");
    Serial.println("[OK] Sistema listo");
    Serial.println("═══════════════════════════════════════════════════════════");
}

// ============================================
// LOOP
// ============================================

void loop() {
    server.handleClient();
    delay(1);
}
