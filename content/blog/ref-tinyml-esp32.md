---
title: "TinyML en ESP32-S3: inteligencia real en un microcontrolador"
date: "2026-09-23"
lang: "es"
summary: "Qué entra y qué no en un ESP32-S3, cómo correr redes neuronales en el borde con TFLite Micro, y la arquitectura de 'cerebro delegado' para combinar hardware embebido con IA local."
tags: ["ia", "tinyml", "esp32", "tensorflow-lite", "referencia"]
category: "referencia"
---

Acá las cosas claras: el ecosistema actual de inteligencia artificial está obsesionado con meter modelos gigantescos en servidores que consumen el equivalente a una ciudad chica. Pero como makers, desarrolladores de hardware y entusiastas de lo *open*, nuestro campo de batalla es diferente. Trabajamos en el borde (edge), con restricciones eléctricas y físicas reales. Hoy vamos a hablar de cómo meter inteligencia real adentro de un ESP32-S3, qué podés hacer con TinyML, y cuáles son los límites físicos que no podemos ignorar.

## La realidad del silicio

Empecemos derribando un mito impulsado por el marketing corporativo. Un Large Language Model (LLM) mínimo, de 1 billón de parámetros y fuertemente cuantizado, necesita alrededor de 700MB de RAM libre solo para cargarse en memoria. 

Un microcontrolador tope de gama para hobbyists, como el ESP32-S3, suele venir con algo entre 8MB y 32MB de PSRAM externa. **Un LLM generativo no entra. Punto.** No importa cuánto comprimas o recortes, la física y el silicio son inflexibles. 

Pero que no puedas tener una IA charlatana que te escriba poemas adentro del chip, **NO significa que no puedas tener inteligencia artificial.** Simplemente necesitamos cambiar el enfoque hacia modelos diseñados específicamente para microcontroladores. 

## Qué es TinyML

TinyML es exactamente eso: Machine Learning hiperoptimizado para microcontroladores y dispositivos embebidos. En lugar de modelos masivos que operan con lenguaje y contexto amplio, TinyML utiliza redes neuronales chicas, entrenadas *offline* en una computadora potente, que luego se ejecutan localmente en el chip para tareas específicas.

El objetivo acá no es generar texto. El objetivo es **clasificar, detectar y predecir.** 

Un modelo TinyML típico pesa kilobytes, no gigabytes, y su ciclo de ejecución es tan rápido y eficiente que puede alimentarse con una batería LiPo. Para esto, nos apoyamos en frameworks especializados como:
- **TensorFlow Lite for Microcontrollers (TFLite Micro):** El estándar de facto para correr inferencia en el borde.
- **ESP-NN:** La librería nativa de Espressif que acelera las redes a nivel de hardware.
- **Edge Impulse:** Una plataforma excelente para capturar datos, entrenar y empaquetar modelos TinyML directamente para C++.

## Qué podés hacer con TinyML en ESP32-S3

Para que te des una idea de lo que realmente podemos lograr con la memoria y capacidad de cómputo limitadas, armé una tabla con casos de uso reales, la entrada que procesan, y los recursos que demandan:

| Aplicación | Input | Modelo típico | RAM necesaria |
|------------|-------|---------------|---------------|
| **Wake-word detection** ("Hey HIOS") | Audio I2S | CNN/RNN | ~200KB |
| **Clasificación de audio** (aplausos, golpes, voz) | Audio | MobileNet chico | ~300KB |
| **Detección de anomalías en sensores** | IMU/Temperatura | Autoencoder | ~50KB |
| **Gesture recognition** (movimientos en el aire) | Acelerómetro | Dense/CNN | ~100KB |

Como ves, todos estos modelos entran cómodamente en la SRAM interna o en la PSRAM de un ESP32-S3.

## El ESP32-S3 como plataforma TinyML

Si bien el ESP32 clásico es capaz de correr algunos modelos muy básicos, el ESP32-S3 fue diseñado con la IA en mente. Hay tres factores que lo hacen ideal para TinyML:

1. **Instrucciones vectoriales (SIMD):** El core Xtensa LX7 del S3 tiene un set de instrucciones diseñadas para acelerar operaciones de vectores y matrices (esencial para los tensores de una red neuronal).
2. **ESP-NN:** Espressif ofrece esta librería en ESP-IDF que aprovecha las instrucciones SIMD para optimizar drásticamente el cálculo de capas comunes (conv2d, depthwise, fully connected). TFLite Micro ya viene integrado con estas optimizaciones en el framework.
3. **PSRAM masiva y Dual Core:** Con módulos que traen de 8 a 32MB de PSRAM, la memoria dejó de ser un cuello de botella para modelos de clasificación. Además, al ser dual core, podés dedicar el Core 1 exclusivamente a la inferencia (que es bloqueante e intensiva) y dejar el Core 0 manejando WiFi, Bluetooth y el resto del firmware sin interrupciones.

## Pipeline: de la idea al modelo corriendo

Correr IA en un microcontrolador requiere un flujo de trabajo distinto al desarrollo de software tradicional. Todo se divide en dos fases: el entrenamiento (en la PC) y la inferencia (en el ESP32).

1. **Recolectar datos:** Capturás datos reales de tus sensores o micrófonos. Si querés detectar gestos, tenés que grabar cientos de movimientos con el acelerómetro conectado al ESP32.
2. **Entrenar el modelo en la PC:** Usás TensorFlow/Keras o PyTorch para diseñar y entrenar la red con tu dataset. 
3. **Convertir a TFLite:** El modelo `.h5` o `.pb` se exporta al formato plano `.tflite`.
4. **Cuantizar a int8:** Este paso es crítico (*post-training quantization*). Convertimos los pesos de la red de números flotantes (32 bits) a enteros (8 bits). Perdemos algo de precisión, pero el modelo pesa 4 veces menos y corre mucho más rápido.
5. **Generar el array en C:** Un microcontrolador no tiene sistema de archivos por defecto. Usamos herramientas como `xxd` o `tflite_model_to_header` para convertir el archivo `.tflite` en un inmenso `const unsigned char array[]` en un archivo `.h`.
6. **Integrar con TFLite Micro:** Incluimos el modelo en el firmware de ESP-IDF o Arduino.
7. **Correr inferencia:** En el loop principal, leemos el sensor, alimentamos el tensor de entrada y corremos la inferencia.

## Ejemplo mínimo: wake-word detection

Aunque un código completo ocuparía todo este artículo, el flujo lógico para algo como detectar "Hey HIOS" (wake-word) es el siguiente:

Primero, configurás un micrófono I2S (por ejemplo, el INMP441) para capturar audio continuo en un buffer circular.
El audio crudo no se lo pasás directo a la red. Hacés un preprocesamiento: típicamente una extracción de características calculando un *Mel spectrogram* o un *MFCC* (Mel-frequency cepstral coefficients) usando transformadas de Fourier en el mismo chip. Esto convierte 1 segundo de audio en una pequeña matriz 2D.
Esa matriz es el tensor de entrada para TFLite Micro. Llamás al *interpreter* para que evalúe los datos y te devuelve un tensor de salida con probabilidades. Si la probabilidad de "Hey HIOS" supera el 85%, el ESP32 despierta y ejecuta la acción deseada.

## La arquitectura "cerebro delegado"

Acá es donde las cosas se ponen realmente interesantes para proyectos como nuestro ecosistema open hardware en HIOS. 

Dado que el ESP32-S3 no puede correr LLMs pero es excelente para interactuar con el mundo físico (I/O) y TinyML, podemos usar un patrón de arquitectura que yo llamo **"Cerebro Delegado"**.

- **El ESP32-S3 actúa como el sistema nervioso periférico:** Escucha comandos con TinyML (wake-word), lee sensores, maneja pantallas y acciona relés o motores.
- **Una PC local actúa como el cerebro:** Corre un LLM complejo (como Llama 3) usando herramientas open-source como `llama.cpp` u Ollama en nuestra red local.

El flujo es simple: el ESP32 detecta localmente por TinyML que alguien dijo la wake-word. Empieza a grabar audio o captura texto, lo manda por WiFi a la PC local, la PC "piensa" y procesa el requerimiento, y devuelve el resultado al ESP32 para que hable o actúe. 

Lo mejor de esta arquitectura es que **lo local-first se mantiene intacto**. Si la PC de la casa está apagada o se cayó el WiFi, el ESP32 no queda como un pisapapeles inútil. Sigue funcionando con su TinyML interno para tareas básicas, mostrando un graceful degradation (degradación elegante) del sistema. Imaginate el macropad HIOS pudiendo ejecutar atajos y macros detectando gestos simples, y conectándose al cerebro principal solo cuando le pedís tareas de análisis complejas.

## Limitaciones honestas

Para cerrar, como siempre en HI Open Systems, cero humo. Estas son las limitaciones reales con las que te vas a encontrar:

- **No vas a tener un chat filosófico en un ESP32.** La inteligencia es reactiva y clasificatoria, no generativa.
- **La latencia es un factor.** Incluso con aceleración SIMD, un modelo de clasificación de audio chico puede tardar 50-200ms en correr la inferencia. Es aceptable para wake-words, pero no para procesamiento en streaming de video o señales de muy alta frecuencia.
- **Olvidate de entrenar en el chip.** El *on-device training* (aprender cosas nuevas en caliente) es un campo en investigación y hoy en día no es viable en estos micros. Siempre entrenás en la PC y desplegás el modelo congelado.

El TinyML en el ESP32-S3 no viene a reemplazar a los servidores de IA, viene a democratizar la computación cognitiva y ponerla donde tiene que estar: en tus manos, sin intermediarios, sin nubes, y sin suscripciones.
