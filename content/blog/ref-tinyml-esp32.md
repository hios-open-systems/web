---
title: "TinyML en ESP32-S3: inteligencia real en un microcontrolador"
date: "2026-09-23"
lang: "es"
summary: "Qué entra y qué no en un ESP32-S3, la latencia de PSRAM vs SRAM, y código completo para correr TFLite Micro en el borde."
tags: ["ia", "tinyml", "esp32", "tensorflow-lite", "referencia"]
category: "referencia"
---

El ecosistema actual de inteligencia artificial está obsesionado con meter modelos gigantescos en servidores, pero el hardware embebido juega con otras reglas. Trabajamos en el borde (edge), con restricciones de memoria estrictas y latencias reales. Correr inteligencia en un ESP32-S3 es posible y muy potente, siempre que entiendas las reglas del silicio.

## La realidad de la memoria: SRAM vs PSRAM

Un LLM generativo, incluso cuantizado, no entra en un microcontrolador. Un ESP32-S3 viene típicamente con 512KB de SRAM interna y hasta 32MB de PSRAM externa por bus SPI/OPI. 

Acá está el cuello de botella físico:
- **SRAM**: Acceso en un ciclo de reloj. Rapidísima. Limitada.
- **PSRAM**: Acceso a través del bus SPI/OPI. Introduce latencia significativa, especialmente en ráfagas de lectura aleatoria.

Para TinyML, el modelo (los pesos) pueden vivir en Flash o PSRAM (es lectura secuencial), pero el **tensor arena** (la memoria de trabajo para las activaciones y tensores intermedios durante la inferencia) **tiene que estar en la SRAM interna** si querés latencias bajas reales para audio o sensores de alta frecuencia. Si el tensor arena cae en PSRAM, los cálculos matemáticos de las capas convolucionales se la van a pasar esperando al bus SPI, destruyendo el rendimiento de las instrucciones vectoriales (SIMD) del S3.

## Frameworks disponibles

El objetivo de TinyML es clasificar, detectar y predecir. Un modelo típico pesa kilobytes. Nos apoyamos en frameworks especializados:

- **TensorFlow Lite for Microcontrollers (TFLite Micro):** El estándar multiplataforma. En ESP-IDF, aprovecha la librería ESP-NN de Espressif que acelera las redes a nivel de hardware (usando las instrucciones SIMD del core Xtensa LX7).
- **ESP-SR (WakeNet/MultiNet):** El framework de audio oficial de Espressif. Si tu único objetivo es un *wake-word* ("Hey HIOS") o reconocimiento de voz offline básico, usá ESP-SR directamente. Está híper optimizado para el ESP32-S3 y es mucho más fácil de configurar que TFLite Micro para audio.
- **Edge Impulse:** Plataforma que automatiza la captura, el entrenamiento y la exportación a C++.

## Pipeline: de la idea al código

1. **Recolectar y Entrenar:** Capturás datos (acelerómetro, audio) y entrenás en TensorFlow/Keras en la PC.
2. **Convertir y Cuantizar a int8:** El modelo pasa a formato `.tflite` y cuantizamos los pesos a 8 bits. Perdemos algo de precisión, pero pesa 4 veces menos y corre usando las instrucciones aceleradas del chip.
3. **Array C:** Convertimos el `.tflite` a un `const unsigned char g_model[]` en un `.h`.
4. **Inferencia:** Alocamos tensores e invocamos el intérprete.

## Esqueleto completo de TFLite Micro

Este es el código base para inicializar un modelo y correr inferencia en C++ (ESP-IDF/Arduino). Nada de magia negra, este es el loop clásico:

```cpp
#include "tensorflow/lite/micro/all_ops_resolver.h"
#include "tensorflow/lite/micro/micro_interpreter.h"
#include "tensorflow/lite/micro/system_setup.h"
#include "tensorflow/lite/schema/schema_generated.h"
// Tu modelo exportado a un array de bytes
#include "my_model.h"

// Globals
const tflite::Model* model = nullptr;
tflite::MicroInterpreter* interpreter = nullptr;
TfLiteTensor* input = nullptr;
TfLiteTensor* output = nullptr;

// Tensor Arena: MUST live in SRAM para latencia baja.
// Ajustar el tamaño (kTensorArenaSize) según el requerimiento del modelo.
const int kTensorArenaSize = 10 * 1024;
// En ESP32, forzamos que se asigne en memoria estática interna (SRAM)
uint8_t tensor_arena[kTensorArenaSize] __attribute__((aligned(16)));

void setup() {
  tflite::InitializeTarget();

  // 1. Cargar el modelo
  model = tflite::GetModel(g_model);
  if (model->version() != TFLITE_SCHEMA_VERSION) {
    // Error de versión incompatible
    return;
  }

  // 2. Cargar operaciones. AllOpsResolver carga todas; en prod, usá MicroMutableOpResolver
  // para cargar solo las necesarias y ahorrar memoria flash/SRAM.
  static tflite::AllOpsResolver resolver;

  // 3. Construir el intérprete
  static tflite::MicroInterpreter static_interpreter(
      model, resolver, tensor_arena, kTensorArenaSize);
  interpreter = &static_interpreter;

  // 4. Alocar memoria para los tensores
  TfLiteStatus allocate_status = interpreter->AllocateTensors();
  if (allocate_status != kTfLiteOk) {
    // Falla si kTensorArenaSize es muy chico
    return;
  }

  // Punteros a los tensores de entrada/salida
  input = interpreter->input(0);
  output = interpreter->output(0);
}

void loop() {
  // 5. Cargar datos al tensor de entrada (ejemplo: float32, o int8 si está cuantizado)
  // Acá copiás los datos de tu sensor/micrófono post-procesados
  for (int i = 0; i < input->bytes / sizeof(float); ++i) {
      input->data.f[i] = readSensorValue(i); 
  }

  // 6. Correr inferencia
  TfLiteStatus invoke_status = interpreter->Invoke();
  if (invoke_status != kTfLiteOk) {
    // Falló la ejecución
    return;
  }

  // 7. Leer salida
  float prediction = output->data.f[0];
  if (prediction > 0.8) {
      // Actuar sobre el resultado
  }
}
```

## Arquitectura de cerebro delegado

Un ESP32-S3 no puede correr LLMs, pero es excelente en I/O y TinyML. Esto habilita la arquitectura de "cerebro delegado": el ESP32 actúa como sistema nervioso periférico. Corre un modelo TinyML liviano para detectar un wake-word. Una vez activado, recolecta audio o datos y los despacha por WiFi a una PC local (el cerebro) corriendo Llama u Ollama. 

Si la red falla, el ESP32 sigue funcionando con sus modelos locales (graceful degradation), sin quedarse como un pisapapeles.

## Trampas comunes

- **Tensor Arena en PSRAM:** Usar `malloc` para el `tensor_arena` en un ESP32 configurado para usar PSRAM externa. La latencia de la inferencia se dispara exponencialmente. Fuerce la SRAM estática.
- **MicroMutableOpResolver vs AllOpsResolver:** Usar `AllOpsResolver` arrastra todo el framework de TFLite a tu binario y te infla el tamaño de la flash y SRAM. Definí solo los OPs que tu modelo necesita con `MicroMutableOpResolver`.
- **Cuelgue de Watchdog por Inferencia:** El método `Invoke()` es fuertemente intensivo en CPU y bloquea. Si un modelo es pesado y toma más de algunos segundos, el Task Watchdog de FreeRTOS va a reiniciar el chip. Pineá la task de inferencia en el Core 1 y considerá llamar a `vTaskDelay` si el modelo permite procesamiento por partes, o modificá el timeout del watchdog.
- **Cuantización que arruina el modelo:** Pasar de float32 a int8 sin dataset de calibración representativo va a resultar en un modelo que corre rápido pero predice cualquier cosa.

## Chuleta

| Tarea / Problema | Solución Recomendada |
|---|---|
| Reconocimiento de Wake-word ("Hey HIOS") | ESP-SR (WakeNet) directo |
| Clasificación de movimiento/vibración | TFLite Micro + Edge Impulse |
| Latencia alta en inferencia | Mover `tensor_arena` a SRAM estática |
| Falta memoria de programa (Flash/SRAM) | Reemplazar `AllOpsResolver` por `MicroMutableOpResolver` |
| Watchdog Resets durante `Invoke()` | Ejecutar en task del Core 1, aumentar Timeout del WDT |
