// ====================================================================
// HIOS Node AI — Main Firmware (ESP32-S3 FreeRTOS Dual Core)
// ====================================================================
// Botón → consulta a Ollama por WiFi → respuesta en el OLED + beep por el
// MAX98357A. Muestra la tensión de la 18650 leída por el divisor en GPIO1.
//
// Credenciales y servidor: NO van en el código. Se pasan por build_flags en
// platformio.ini (con los valores reales solo en tu copia local).
// ====================================================================
#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <math.h>
#include "driver/i2s.h"

#ifndef WIFI_SSID
#define WIFI_SSID "CAMBIAME"
#endif
#ifndef WIFI_PASS
#define WIFI_PASS "CAMBIAME"
#endif
#ifndef OLLAMA_URL
#define OLLAMA_URL "http://192.168.1.50:11434/api/chat"
#endif
#ifndef MODEL_NAME
#define MODEL_NAME "llama3.1:8b"
#endif

// --- Pines (fuente de verdad: projects/hios-node-ai/hardware/README.md) ---
// GPIO26–37 los usa la flash/PSRAM octal del N16R8 y GPIO22–25 no existen
// en el S3: nada del cableado puede caer ahí.
const int BTN_PIN = 4;        // pulsador PTT a GND (INPUT_PULLUP)
const int LED_PIN = 2;        // LED de estado vía 330Ω
const int SDA_PIN = 8;        // OLED SDA (default de Wire en el S3)
const int SCL_PIN = 9;        // OLED SCL (default de Wire en el S3)
const int VBAT_PIN = 1;       // ADC1_CH0, divisor 100k/100k desde la batería
const int AMP_BCLK_PIN = 15;  // MAX98357A BCLK
const int AMP_LRC_PIN = 16;   // MAX98357A LRC
const int AMP_DIN_PIN = 17;   // MAX98357A DIN
// Micrófono INMP441: cableado y reservado, el firmware todavía no lo lee.
const int MIC_SCK_PIN = 42;
const int MIC_WS_PIN = 41;
const int MIC_SD_PIN = 40;

const float VBAT_DIVIDER = 2.0f;  // (100k + 100k) / 100k
const i2s_port_t AMP_PORT = I2S_NUM_1;  // I2S_NUM_0 queda para el micrófono
const int SAMPLE_RATE = 16000;
const int BEEP_AMPLITUDE = 3000;  // de 32767: volumen moderado para un 4Ω 3W

Adafruit_SSD1306 display(128, 64, &Wire, -1);

volatile bool isThinking = false;
volatile bool triggerPrompt = false;
volatile bool beepPending = false;
char responseBuffer[512] = "Nodo HIOS AI Listo. Presiona BTN.";

void ampInit() {
  i2s_config_t cfg = {
    .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_TX),
    .sample_rate = SAMPLE_RATE,
    .bits_per_sample = I2S_BITS_PER_SAMPLE_16BIT,
    .channel_format = I2S_CHANNEL_FMT_RIGHT_LEFT,  // estéreo: suena con SD en L, R o mezcla
    .communication_format = I2S_COMM_FORMAT_STAND_I2S,
    .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
    .dma_buf_count = 4,
    .dma_buf_len = 256,
    .use_apll = false,
    .tx_desc_auto_clear = true,
    .fixed_mclk = 0,
  };
  i2s_pin_config_t pins = {
    .mck_io_num = I2S_PIN_NO_CHANGE,
    .bck_io_num = AMP_BCLK_PIN,
    .ws_io_num = AMP_LRC_PIN,
    .data_out_num = AMP_DIN_PIN,
    .data_in_num = I2S_PIN_NO_CHANGE,
  };
  i2s_driver_install(AMP_PORT, &cfg, 0, NULL);
  i2s_set_pin(AMP_PORT, &pins);
  i2s_zero_dma_buffer(AMP_PORT);
}

// Tono corto: avisa que llegó la respuesta (o un error).
void beep(float freq, int ms) {
  static int16_t buf[256 * 2];  // intercalado [L, R]: el mismo sample en los dos slots
  const int total = (SAMPLE_RATE * ms) / 1000;
  const double inc = 2.0 * M_PI * freq / SAMPLE_RATE;
  double phase = 0.0;
  for (int done = 0; done < total; done += 256) {
    for (int i = 0; i < 256; i++) {
      const int16_t sample = (int16_t)(sin(phase) * BEEP_AMPLITUDE);
      buf[i * 2] = sample;
      buf[i * 2 + 1] = sample;
      phase += inc;
      if (phase > 2.0 * M_PI) phase -= 2.0 * M_PI;
    }
    size_t written;
    i2s_write(AMP_PORT, buf, sizeof(buf), &written, portMAX_DELAY);
  }
  i2s_zero_dma_buffer(AMP_PORT);
}

float readBatteryVolts() {
  uint32_t sum = 0;
  for (int i = 0; i < 8; i++) sum += analogReadMilliVolts(VBAT_PIN);
  return (sum / 8.0f) * VBAT_DIVIDER / 1000.0f;
}

void networkTask(void *pvParameters) {
  for (;;) {
    if (triggerPrompt && !isThinking) {
      triggerPrompt = false;
      isThinking = true;
      digitalWrite(LED_PIN, HIGH);

      if (WiFi.status() == WL_CONNECTED) {
        HTTPClient http;
        http.begin(OLLAMA_URL);
        http.addHeader("Content-Type", "application/json");
        http.setTimeout(30000);

        JsonDocument doc;
        doc["model"] = MODEL_NAME;
        doc["stream"] = false;

        JsonArray messages = doc["messages"].to<JsonArray>();
        JsonObject msg1 = messages.add<JsonObject>();
        msg1["role"] = "system";
        msg1["content"] = "Eres el asistente de voz del laboratorio HIOS. Responde en 15 palabras de forma concisa.";

        JsonObject msg2 = messages.add<JsonObject>();
        msg2["role"] = "user";
        msg2["content"] = "Dame una frase de inspiracion maker para hoy.";

        String body;
        serializeJson(doc, body);

        int code = http.POST(body);
        if (code == 200) {
          String res = http.getString();
          JsonDocument resDoc;
          if (!deserializeJson(resDoc, res)) {
            const char* txt = resDoc["message"]["content"];
            snprintf(responseBuffer, sizeof(responseBuffer), "%s", txt ? txt : "Sin texto");
          }
        } else {
          snprintf(responseBuffer, sizeof(responseBuffer), "HTTP Err: %d", code);
        }
        http.end();
      } else {
        snprintf(responseBuffer, sizeof(responseBuffer), "WiFi Desconectado");
      }

      isThinking = false;
      beepPending = true;
      digitalWrite(LED_PIN, LOW);
    }
    vTaskDelay(pdMS_TO_TICKS(100));
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(BTN_PIN, INPUT_PULLUP);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);
  analogSetPinAttenuation(VBAT_PIN, ADC_11db);
  ampInit();

  Wire.begin(SDA_PIN, SCL_PIN);
  if (display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    display.clearDisplay();
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);
    display.setCursor(0, 0);
    display.println("HIOS AI Node Init...");
    display.println("Conectando WiFi...");
    display.display();
  }

  WiFi.begin(WIFI_SSID, WIFI_PASS);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
  }

  xTaskCreatePinnedToCore(networkTask, "NetTask", 8192, NULL, 2, NULL, 0);
  beep(880, 120);
}

void loop() {
  static unsigned long lastDebounce = 0;
  if (digitalRead(BTN_PIN) == LOW && (millis() - lastDebounce > 300)) {
    lastDebounce = millis();
    if (!isThinking) {
      triggerPrompt = true;
      snprintf(responseBuffer, sizeof(responseBuffer), "Pensando en PC local...");
    }
  }

  if (beepPending) {
    beepPending = false;
    beep(1320, 80);
  }

  display.clearDisplay();
  display.setCursor(0, 0);
  display.printf("HIOS AI Node  %.2fV", readBatteryVolts());
  display.drawLine(0, 10, 128, 10, SSD1306_WHITE);
  display.setCursor(0, 14);
  display.println(isThinking ? "[PENSANDO...]" : "[LISTO]");
  display.setCursor(0, 26);
  display.println(responseBuffer);
  display.display();

  delay(50);
}
