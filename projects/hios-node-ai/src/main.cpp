// ====================================================================
// HIOS Node AI — Main Firmware (ESP32-S3 FreeRTOS Dual Core)
// ====================================================================
#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

const char* WIFI_SSID = "HIOS_LAB_WIFI";
const char* WIFI_PASS = "LocalFirst2026";
const char* OLLAMA_URL = "http://192.168.1.50:11434/api/chat";
const char* MODEL_NAME = "llama3.1:8b";

const int BTN_PIN = 4;
const int LED_PIN = 2;
const int SDA_PIN = 21;
const int SCL_PIN = 22;

Adafruit_SSD1306 display(128, 64, &Wire, -1);

volatile bool isThinking = false;
volatile bool triggerPrompt = false;
char responseBuffer[512] = "Nodo HIOS AI Listo. Presiona BTN.";

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

  Wire.begin(SDA_PIN, SCL_PIN);
  if (display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    display.clearDisplay();
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);
    display.setCursor(0, 0);
    display.println("HIOS AI Node Init...");
    display.display();
  }

  WiFi.begin(WIFI_SSID, WIFI_PASS);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
  }

  xTaskCreatePinnedToCore(networkTask, "NetTask", 8192, NULL, 2, NULL, 0);
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

  display.clearDisplay();
  display.setCursor(0, 0);
  display.println("HIOS AI Node (ESP32-S3)");
  display.drawLine(0, 10, 128, 10, SSD1306_WHITE);
  display.setCursor(0, 14);
  display.println(isThinking ? "[PENSANDO...]" : "[LISTO]");
  display.setCursor(0, 26);
  display.println(responseBuffer);
  display.display();

  delay(50);
}
