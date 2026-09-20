---
title: "Conectar un ESP32 a un LLM local: el bridge WiFi"
date: "2026-09-24"
lang: "es"
summary: "Tutorial paso a paso: levantar Ollama en la PC, hacer POST desde un ESP32 por WiFi, y recibir respuestas de una IA sin tocar una sola nube."
tags: ["ia", "esp32", "ollama", "local-first", "tutorial"]
category: "devlog"
---

Ayer hablamos de la arquitectura del "cerebro delegado", donde usamos un microcontrolador como el sistema nervioso (interfaces físicas) y una PC como el cerebro principal para tareas pesadas de inteligencia artificial. Hoy vamos a ensuciarnos las manos y hacerlo realidad.

En este tutorial vamos a conectar un ESP32 directamente a un LLM (Large Language Model) corriendo localmente en tu computadora. Nada de OpenAI, nada de nubes propietarias, nada de pagar por tokens. Todo sucede dentro de tu red WiFi local.

## La idea

El concepto es directo:
1. Tenés un ESP32 con conexión WiFi.
2. Tenés una PC en tu casa corriendo un LLM potente usando Ollama.
3. El ESP32 le manda una pregunta (prompt) al LLM a través de una petición HTTP POST.
4. Ollama procesa, genera la respuesta y se la devuelve al ESP32.
5. El ESP32 la parsea y la muestra en el puerto Serial (o en una pantallita).

La IA "piensa" en tu red local, de manera privada y segura.

## Paso 1: Instalar Ollama en la PC

Ollama es probablemente la mejor herramienta actual para correr modelos grandes localmente sin volverse loco con configuraciones y dependencias. 

1. Descargá e instalá Ollama desde [ollama.com](https://ollama.com).
2. Abrí tu terminal y bajate un modelo. Vamos a usar `llama3.1:8b-instruct-q4_K_M` que es un excelente balance entre tamaño y capacidad de razonamiento:
   ```bash
   ollama pull llama3.1:8b
   ```
3. Por defecto, el servidor de Ollama solo escucha en `localhost` (127.0.0.1). Para que nuestro ESP32 pueda acceder a través del WiFi local, tenemos que decirle que escuche en todas las interfaces de red. Frená el servicio si está corriendo, y levantalo así:
   ```bash
   # En Linux/macOS:
   OLLAMA_HOST=0.0.0.0 ollama serve
   
   # En Windows (Powershell):
   $env:OLLAMA_HOST="0.0.0.0"
   ollama serve
   ```
   *(Asegurate de que el firewall de tu PC permita conexiones entrantes al puerto 11434).*
4. **Test rápido:** Averiguá la IP local de tu PC (ejemplo: `192.168.1.50`). En otra computadora o en el celular conectado al mismo WiFi, probá esto:
   ```bash
   curl http://192.168.1.50:11434/api/generate -d '{"model": "llama3.1:8b", "prompt": "Hola", "stream": false}'
   ```
   Si te devuelve un JSON con una respuesta, el cerebro está online y listo para escuchar al ESP32.

## Paso 2: El código del ESP32

Para que el ESP32 hable con Ollama vamos a usar el entorno de Arduino con las librerías nativas `WiFi.h` y `HTTPClient.h`. También vas a necesitar instalar la librería **ArduinoJson** (desde el Library Manager) para armar y desarmar los paquetes de datos.

Acá tenés el sketch completo, funcional y comentado:

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// Reemplazar con los datos de tu red
const char* ssid = "TU_WIFI";
const char* password = "TU_PASSWORD";

// Reemplazar con la IP local de la PC corriendo Ollama
const char* ollama_url = "http://192.168.1.50:11434/api/generate";

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  // 1. Conectar a WiFi
  Serial.printf("\nConectando a %s...\n", ssid);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConectado! IP: " + WiFi.localIP().toString());
  
  // Hacer la pregunta una vez en el setup para la prueba
  askOllama("En una oración, explicame qué es el hardware open source.");
}

void loop() {
  // En un caso real, acá leerías sensores o botones
  // para disparar consultas a Ollama.
}

void askOllama(String promptText) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Error: WiFi desconectado.");
    return;
  }
  
  Serial.println("\n--- Enviando pregunta a Ollama ---");
  Serial.println("Pregunta: " + promptText);
  
  HTTPClient http;
  http.begin(ollama_url);
  http.addHeader("Content-Type", "application/json");
  // Aumentamos el timeout a 30 segundos porque los LLMs tardan en pensar
  http.setTimeout(30000); 
  
  // 2. Armar el payload JSON usando ArduinoJson
  StaticJsonDocument<512> doc;
  doc["model"] = "llama3.1:8b";
  doc["prompt"] = promptText;
  doc["stream"] = false; // Queremos la respuesta entera al final, no streameada
  
  String requestBody;
  serializeJson(doc, requestBody);
  
  // 3. Hacer HTTP POST
  Serial.println("Procesando... (el modelo está pensando)");
  int httpResponseCode = http.POST(requestBody);
  
  if (httpResponseCode > 0) {
    // 4. Parsear la respuesta
    String response = http.getString();
    
    StaticJsonDocument<2048> responseDoc;
    DeserializationError error = deserializeJson(responseDoc, response);
    
    if (!error) {
      // 5. Imprimir el resultado
      String answer = responseDoc["response"].as<String>();
      Serial.println("\n--- Respuesta de Ollama ---");
      Serial.println(answer);
      Serial.println("---------------------------");
    } else {
      Serial.print("Error al parsear JSON: ");
      Serial.println(error.c_str());
    }
  } else {
    Serial.print("Error en la petición HTTP: ");
    Serial.println(httpResponseCode);
  }
  
  http.end();
}
```

## Paso 3: Ponerlo a prueba

Compilá el código y subilo a tu ESP32. Abrí el Serial Monitor (a 115200 baudios). Deberías ver cómo se conecta al WiFi, manda la petición y luego hay una pausa de algunos segundos. 

En ese momento, mirá los recursos de tu PC (el administrador de tareas): vas a ver picos en la GPU o CPU. Ollama está procesando el texto. De pronto, la respuesta aparece mágicamente en el monitor serial de tu placa. 

La latencia exacta depende de tu hardware (si tenés placa de video dedicada en la PC vuela, si lo corrés en CPU tarda más) y del modelo que hayas elegido.

## Lo local-first se mantiene

Algo vital en nuestra filosofía de diseño en HI Open Systems: **el hardware nunca debe quedar inútil si la IA no está disponible.**

Fijate que en el código agregamos un chequeo de WiFi y manejamos los errores HTTP. Si la PC está apagada o el servidor de Ollama crashea, el ESP32 recibe un error, reporta por Serial y su bucle principal (`loop()`) sigue ejecutándose sin bloquearse. 

La IA se convierte en una capa opcional que enriquece al dispositivo, nunca un requisito estructural para que el aparato funcione de base. Igual que hacemos con el *companion daemon* del macropad.

## Ideas para expandir

Esto es solo la base. Con este bridge armadito, se te abre un mundo de proyectos súper interesantes:

- **Comandos de voz completos:** Juntar el TinyML del que hablamos ayer (para detectar el *wake-word*), grabar audio, mandarlo al LLM (usando Whisper local o text-to-speech) y recibir la respuesta para imprimirla en una pantallita OLED.
- **El botón del pánico AI:** Un botón físico enorme en tu escritorio (fácilmente integrable con el macropad HIOS) que cuando lo apretás, manda la última línea de error de tu PC al ESP32, que consulta al LLM y muestra la solución.
- **Análisis de sensores on-the-fly:** Enviar lecturas de temperatura, humedad y luz ambiente de una habitación a Ollama, y pedirle: *"Con estos datos crudos, diagnosticá si la habitación necesita ventilación y devolvé solo la respuesta 'SI' o 'NO'"*.

Las combinaciones son infinitas cuando tenés acceso irrestricto al cerebro de la máquina. ¡Que lo disfruten y a hackear en local!
