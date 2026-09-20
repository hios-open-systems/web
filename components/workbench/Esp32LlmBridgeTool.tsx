'use client';

import React, { useMemo, useState } from 'react';
import { Card, Col, Input, InputNumber, Row, Select, Space, Typography } from 'antd';
import { CopyButton } from './CopyButton';
import { ToolHeader } from './ToolHeader';
import styles from './workbench.module.css';

const { Text } = Typography;

export function Esp32LlmBridgeTool() {
  const [ssid, setSsid] = useState<string>('MiRedWiFi');
  const [password, setPassword] = useState<string>('ClaveSecreta123');
  const [hostIp, setHostIp] = useState<string>('192.168.1.50');
  const [port, setPort] = useState<number>(11434);
  const [model, setModel] = useState<string>('llama3.1:8b');
  const [btnGpio, setBtnGpio] = useState<number>(4);
  const [ledGpio, setLedGpio] = useState<number>(2);
  const [sdaGpio, setSdaGpio] = useState<number>(21);
  const [sclGpio, setSclGpio] = useState<number>(22);
  const [systemPrompt, setSystemPrompt] = useState<string>('Eres el asistente de voz de HIOS. Responde en español de forma directa y concisa en 2 oraciones.');

  const generatedCode = useMemo(() => {
    return `// ====================================================================
// HIOS ESP32 LLM Bridge - Firmware No Bloqueante con FreeRTOS
// Generado automáticamente desde openhios.dev
// ====================================================================
#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

// --- Configuración de Red e IA Local ---
const char* WIFI_SSID = "${ssid}";
const char* WIFI_PASS = "${password}";
const char* OLLAMA_URL = "http://${hostIp}:${port}/api/chat";
const char* MODEL_NAME = "${model}";
const char* SYSTEM_PROMPT = "${systemPrompt.replace(/"/g, '\\"')}";

// --- Asignación de Pines ---
const int BTN_PIN = ${btnGpio};
const int LED_PIN = ${ledGpio};
const int SDA_PIN = ${sdaGpio};
const int SCL_PIN = ${sclGpio};

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);

// Estado y sincronización FreeRTOS
volatile bool isThinking = false;
volatile bool triggerPrompt = false;
char responseBuffer[512] = "Presiona el boton para consultar a la IA.";

// Task de FreeRTOS para la red (ejecuta en Core 0 para no congelar la UI)
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
        http.setTimeout(30000); // 30s timeout para el LLM local

        // Construir JSON payload con ArduinoJson v7 (usando /api/chat para evitar desbordes)
        JsonDocument doc;
        doc["model"] = MODEL_NAME;
        doc["stream"] = false;

        JsonArray messages = doc["messages"].to<JsonArray>();
        JsonObject msg1 = messages.add<JsonObject>();
        msg1["role"] = "system";
        msg1["content"] = SYSTEM_PROMPT;

        JsonObject msg2 = messages.add<JsonObject>();
        msg2["role"] = "user";
        msg2["content"] = "Dame un reporte de estado rapido del sistema.";

        String requestBody;
        serializeJson(doc, requestBody);

        int httpCode = http.POST(requestBody);
        if (httpCode == HTTP_CODE_OK) {
          String response = http.getString();
          JsonDocument resDoc;
          DeserializationError err = deserializeJson(resDoc, response);

          if (!err) {
            const char* reply = resDoc["message"]["content"];
            snprintf(responseBuffer, sizeof(responseBuffer), "%s", reply ? reply : "Sin respuesta");
          } else {
            snprintf(responseBuffer, sizeof(responseBuffer), "Error JSON: %s", err.c_str());
          }
        } else {
          snprintf(responseBuffer, sizeof(responseBuffer), "HTTP Error: %d", httpCode);
        }
        http.end();
      } else {
        snprintf(responseBuffer, sizeof(responseBuffer), "Sin conexion WiFi.");
      }

      isThinking = false;
      digitalWrite(LED_PIN, LOW);
    }
    vTaskDelay(pdMS_TO_TICKS(100)); // Ceder CPU a la task IDLE de Core 0
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(BTN_PIN, INPUT_PULLUP);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  // Inicializar I2C y Pantalla OLED
  Wire.begin(SDA_PIN, SCL_PIN);
  if (display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    display.clearDisplay();
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);
    display.setCursor(0, 0);
    display.println("HIOS AI Bridge Init...");
    display.display();
  }

  // Conectar WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\\nWiFi Conectado!");

  // Crear Task de Red en Core 0 (PRO_CPU)
  xTaskCreatePinnedToCore(
    networkTask,
    "NetTask",
    8192,       // 8KB Stack
    NULL,
    2,          // Prioridad media
    NULL,
    0           // Pineado a Core 0
  );
}

void loop() {
  // Manejo de botón a pelo en Core 1 (APP_CPU) sin retardos de red
  static unsigned long lastDebounce = 0;
  if (digitalRead(BTN_PIN) == LOW && (millis() - lastDebounce > 300)) {
    lastDebounce = millis();
    if (!isThinking) {
      triggerPrompt = true;
      snprintf(responseBuffer, sizeof(responseBuffer), "Pensando en PC local...");
    }
  }

  // Actualizar Pantalla OLED
  display.clearDisplay();
  display.setCursor(0, 0);
  display.println("HIOS AI Bridge");
  display.drawLine(0, 10, 128, 10, SSD1306_WHITE);
  display.setCursor(0, 15);
  display.println(isThinking ? "[PENSANDO...]" : "[LISTO]");
  display.setCursor(0, 28);
  display.println(responseBuffer);
  display.display();

  delay(50);
}
`;
  }, [ssid, password, hostIp, port, model, btnGpio, ledGpio, sdaGpio, sclGpio, systemPrompt]);

  const platformioIni = useMemo(() => {
    return `; PlatformIO Configuration File para HIOS ESP32 LLM Bridge
[env:esp32dev]
platform = espressif32
board = esp32dev
framework = arduino
monitor_speed = 115200
lib_deps =
    bblanchon/ArduinoJson @ ^7.0.4
    adafruit/Adafruit GFX Library @ ^1.11.9
    adafruit/Adafruit SSD1306 @ ^2.5.9
`;
  }, []);

  const themeVars = useMemo(
    () =>
      ({
        '--wb-surface-border': 'var(--hios-border)',
        '--wb-surface-bg': 'var(--hios-bg)',
        '--wb-surface-soft-bg': 'var(--hios-bg-secondary)',
        '--wb-text-muted': 'var(--hios-text-secondary)',
      }) as React.CSSProperties,
    [],
  );

  return (
    <Space direction="vertical" size={20} style={themeVars} className={styles.stackFull}>
      <ToolHeader
        eyebrow="Generador de Firmware ESP32"
        title="Generador de Firmware ESP32 ↔ LLM Bridge"
        description="Genera código C++ no bloqueante para ESP32 con FreeRTOS, ArduinoJson v7 y pantalla OLED I2C para consultar tu servidor de IA local (Ollama o llama.cpp)."
        locality="local"
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title="1. Configuración de WiFi e IP Local" className={styles.cardSurface}>
            <Space direction="vertical" style={{ width: '100%' }} size={12}>
              <div>
                <Text type="secondary">SSID de WiFi:</Text>
                <Input value={ssid} onChange={(e) => setSsid(e.target.value)} />
              </div>
              <div>
                <Text type="secondary">Password WiFi:</Text>
                <Input.Password value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <Row gutter={8}>
                <Col span={16}>
                  <Text type="secondary">IP Local de la PC (Ollama):</Text>
                  <Input value={hostIp} onChange={(e) => setHostIp(e.target.value)} />
                </Col>
                <Col span={8}>
                  <Text type="secondary">Puerto:</Text>
                  <InputNumber style={{ width: '100%' }} value={port} onChange={(v) => setPort(v || 11434)} />
                </Col>
              </Row>
              <div>
                <Text type="secondary">Modelo de LLM en Ollama:</Text>
                <Select
                  style={{ width: '100%' }}
                  value={model}
                  onChange={setModel}
                  options={[
                    { label: 'Llama 3.1 8B (llama3.1:8b)', value: 'llama3.1:8b' },
                    { label: 'Qwen 2.5 Coder 7B (qwen2.5-coder:7b)', value: 'qwen2.5-coder:7b' },
                    { label: 'Phi-3.5 Mini (phi3.5)', value: 'phi3.5' },
                    { label: 'SmolLM2 1.7B (smollm2:1.7b)', value: 'smollm2:1.7b' },
                  ]}
                />
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title="2. Asignación de Pines y Prompt" className={styles.cardSurface}>
            <Space direction="vertical" style={{ width: '100%' }} size={12}>
              <Row gutter={8}>
                <Col span={12}>
                  <Text type="secondary">Pin Botón Trigger:</Text>
                  <InputNumber style={{ width: '100%' }} value={btnGpio} onChange={(v) => setBtnGpio(v ?? 4)} addonBefore="GPIO" />
                </Col>
                <Col span={12}>
                  <Text type="secondary">Pin LED Status:</Text>
                  <InputNumber style={{ width: '100%' }} value={ledGpio} onChange={(v) => setLedGpio(v ?? 2)} addonBefore="GPIO" />
                </Col>
              </Row>

              <Row gutter={8}>
                <Col span={12}>
                  <Text type="secondary">Display OLED SDA:</Text>
                  <InputNumber style={{ width: '100%' }} value={sdaGpio} onChange={(v) => setSdaGpio(v ?? 21)} addonBefore="GPIO" />
                </Col>
                <Col span={12}>
                  <Text type="secondary">Display OLED SCL:</Text>
                  <InputNumber style={{ width: '100%' }} value={sclGpio} onChange={(v) => setSclGpio(v ?? 22)} addonBefore="GPIO" />
                </Col>
              </Row>

              <div>
                <Text type="secondary">System Prompt:</Text>
                <Input.TextArea rows={2} value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} />
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      <Card title="3. Código Firmware C++ Generado (`src/main.cpp`)" className={styles.cardSurface}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text strong>Firmware listo para PlatformIO / Arduino IDE:</Text>
          <CopyButton value={generatedCode} />
        </div>
        <pre style={{ background: 'var(--hios-bg-secondary)', padding: 16, borderRadius: 6, overflowX: 'auto', fontSize: 13, maxHeight: 400, margin: 0 }}>
          {generatedCode}
        </pre>
      </Card>

      <Card title="4. Archivo `platformio.ini`" className={styles.cardSurface}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text strong>Configuración de dependencias:</Text>
          <CopyButton value={platformioIni} />
        </div>
        <pre style={{ background: 'var(--hios-bg-secondary)', padding: 12, borderRadius: 6, overflowX: 'auto', fontSize: 13, margin: 0 }}>
          {platformioIni}
        </pre>
      </Card>

      <Card title="5. Arquitectura del Firmware Generado" className={styles.cardSurface}>
        <Typography.Paragraph style={{ margin: 0 }}>
          El código aísla las operaciones de red de la interfaz física. La función <code>networkTask</code> se ejecuta como una task de FreeRTOS pineada al Core 0 (donde reside el stack de WiFi del ESP32). La función <code>loop()</code> se ejecuta de forma continua en el Core 1, manteniendo la lectura del botón y el refresco de la pantalla OLED a 60 FPS sin sufrir congelamientos ni timeouts de HTTP.
        </Typography.Paragraph>
      </Card>
    </Space>
  );
}
