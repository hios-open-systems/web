---
title: "Conectar un ESP32 a un LLM local: el bridge WiFi"
date: "2026-09-24"
lang: "es"
summary: "Levantar Ollama en la PC, hacer POST desde un ESP32 en una task de FreeRTOS sin bloquear el loop, parsear JSON sin overflow y usar un botón físico para hablar con IA local."
tags: ["ia", "esp32", "ollama", "local-first", "tutorial"]
category: "devlog"
---

Ayer hablamos del "cerebro delegado": el ESP32 como sistema nervioso (interfaces físicas) y la PC como cerebro principal para la IA pesada. Hoy vamos a escribir el firmware y armar el circuito para conectarlos por WiFi, usando Ollama localmente y sin tocar una sola nube propietaria.

## Paso 1: Ollama expuesto en red local

Por defecto, Ollama solo escucha en `localhost` (127.0.0.1). Para que el ESP32 lo vea, hay que forzarlo a escuchar en `0.0.0.0`.

- **En Windows (Servicio del System Tray):** Hacer click derecho en el ícono de Ollama en la barra de tareas y elegir "Quit". Luego, abrí variables de entorno del sistema, agregá una nueva variable de usuario llamada `OLLAMA_HOST` con el valor `0.0.0.0`. Volvé a abrir Ollama desde el menú inicio.
- **En Linux/macOS:**
  ```bash
  OLLAMA_HOST=0.0.0.0 ollama serve
  ```

Bajate un modelo rápido:
```bash
ollama pull llama3.1:8b
```

Averiguá tu IP local (ej. `192.168.1.50`) y probá desde otro equipo (o celular) con `curl`:
```bash
curl http://192.168.1.50:11434/api/chat -d '{"model": "llama3.1:8b", "messages": [{"role": "user", "content": "Hola"}], "stream": false}'
```

Ojo acá: usamos `/api/chat` en lugar de `/api/generate`. La ruta de generate de Ollama devuelve un array `context` inmenso de ~15KB que destruye cualquier buffer JSON de Arduino. Usar `/api/chat` mantiene la respuesta limpia.

## Paso 2: Hardware mínimo

Para que no sea solo mandar texto vacío al aire, armemos un circuito básico. Un botón en el pin 4 (con pull-up interno) para gatillar la consulta, y un LED (o el del pin 2) para señalizar que el modelo está "pensando".

- **Botón:** Entre GPIO 4 y GND.
- **LED:** GPIO 2 (o LED onboard).

## Paso 3: El Firmware no bloqueante

Acá está el error de novato clásico: tirar el `HTTPClient.POST()` directamente en el `loop()`. Un LLM puede tardar 10 a 30 segundos en responder. Si bloqueás el `loop()` todo ese tiempo, no podés leer botones, actualizar pantallas y corrés el riesgo de comerte un watchdog reset.

La solución es FreeRTOS: mandamos el POST en una **task separada pineada al Core 0** (junto con el stack de WiFi) y nos comunicamos con la task principal mediante variables seguras (o colas). En el Core 1, el `loop()` sigue girando rapidísimo leyendo el botón a pelo o actualizando una UI. 

Librerías a instalar: **ArduinoJson v7** (usamos la sintaxis nueva `JsonDocument`, sin el `StaticJsonDocument` obsoleto).

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* ssid = "TU_WIFI";
const char* password = "TU_PASSWORD";
const char* ollama_url = "http://192.168.1.50:11434/api/chat";

const int BTN_PIN = 4;
const int LED_PIN = 2;

// Variables de estado atómicas o protegidas
volatile bool requestPending = false;
String promptQueue = "";

void setup() {
  Serial.begin(115200);
  pinMode(BTN_PIN, INPUT_PULLUP);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi OK");

  // Creamos la task de red en el Core 0
  xTaskCreatePinnedToCore(
    networkTask,      // Función
    "OllamaTask",     // Nombre
    8192,             // Stack size (8KB mínimo para JSON y HTTP)
    NULL,             // Parámetros
    1,                // Prioridad
    NULL,             // Handle
    0                 // Core 0 (PRO_CPU, donde corre el WiFi)
  );
}

void loop() {
  // El Core 1 queda libre y reactivo a los milisegundos
  
  // Debounce ultra básico
  static uint32_t lastPress = 0;
  if (digitalRead(BTN_PIN) == LOW && millis() - lastPress > 1000 && !requestPending) {
    promptQueue = "Explicame FreeRTOS en una sola frase.";
    requestPending = true;
    lastPress = millis();
    Serial.println("Botón presionado. Solicitud encolada.");
  }
  
  // Podemos parpadear un LED o actualizar un OLED acá sin interrupciones
  if (requestPending) {
    digitalWrite(LED_PIN, (millis() % 500 < 250) ? HIGH : LOW);
  } else {
    digitalWrite(LED_PIN, LOW);
  }

  delay(10); // Ceder CPU a la IDLE task del Core 1
}

// Esta task vive en el Core 0, bloquea tranquilamente esperando el HTTP
void networkTask(void *param) {
  for(;;) {
    if (requestPending && WiFi.status() == WL_CONNECTED) {
      Serial.println("\n--- Enviando POST a Ollama ---");
      
      HTTPClient http;
      http.begin(ollama_url);
      http.addHeader("Content-Type", "application/json");
      http.setTimeout(30000); // 30 segundos timeout
      
      // Armamos el payload con ArduinoJson v7
      JsonDocument doc;
      doc["model"] = "llama3.1:8b";
      doc["stream"] = false;
      
      // Estructura de array para /api/chat
      JsonArray messages = doc["messages"].to<JsonArray>();
      JsonObject msg = messages.add<JsonObject>();
      msg["role"] = "user";
      msg["content"] = promptQueue;
      
      String requestBody;
      serializeJson(doc, requestBody);
      
      int httpCode = http.POST(requestBody);
      
      if (httpCode > 0) {
        String payload = http.getString();
        
        JsonDocument responseDoc;
        DeserializationError error = deserializeJson(responseDoc, payload);
        
        if (!error) {
          String answer = responseDoc["message"]["content"].as<String>();
          Serial.println("Respuesta del Cerebro:");
          Serial.println(answer);
        } else {
          Serial.println("Error JSON parse: " + String(error.c_str()));
        }
      } else {
        Serial.println("Error HTTP: " + http.errorToString(httpCode));
      }
      
      http.end();
      requestPending = false; 
    }
    
    // Si no hay requests, esperamos sin comer CPU (cedemos al Core 0)
    vTaskDelay(pdMS_TO_TICKS(100)); 
  }
}
```

## Resiliencia ante todo

Si la PC con Ollama está apagada, el request falla por timeout. Gracias a que la llamada HTTP está en `networkTask`, el botón de hardware sigue leyendo su estado de forma inmediata y el sistema nunca se clava (graceful degradation). Si le pusieras un display, seguiría mostrando animaciones de UI fluidas. Esta separación de responsabilidades (UI/Hardware vs I/O Lento de Red) es vital.

## Trampas comunes

- **Usar `/api/generate` de Ollama:** Te devuelve el array infinito `context`. Un buffer JSON en ESP32 va a sufrir un overflow al parsearlo, cortando el mensaje o crasheando. `/api/chat` no lo manda.
- **Stack size en `xTaskCreate`:** Procesar HTTPS o JSON largos requiere memoria. Si le pasás `1024` bytes de stack, te comés un Stack Overflow en el Core 0 apenas hagas el POST. Arrancá en 8KB.
- **No liberar la request:** Si ocurre un error de red y olvidás resetear la bandera (`requestPending = false`), el loop se queda parpadeando el LED para siempre y no podés mandar más mensajes. Asegurate de limpiar el estado al final de la task.
