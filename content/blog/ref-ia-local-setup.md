---
title: "IA local: inferencia con llama.cpp y modelos cuantizados"
date: "2026-09-22"
lang: "es"
summary: "Setup paso a paso para correr modelos de lenguaje en tu máquina: llama.cpp, cuantización GGUF, GPU offloading y los parámetros que cambian de horas a segundos."
tags: ["ia", "llama-cpp", "llm", "local", "referencia"]
category: "referencia"
---

Correr inteligencia artificial localmente dejó de ser un privilegio para laboratorios con servidores de cientos de miles de dólares. Hoy, si tenés una computadora más o menos decente, podés levantar tu propio modelo de lenguaje (LLM) en el escritorio, sin depender de la nube de una corporación, sin pagar suscripciones y manteniendo tus datos 100% privados.

En este artículo de referencia vamos a ver exactamente cómo hacerlo usando `llama.cpp`.

## Qué es un LLM

Brevemente, un modelo de lenguaje grande (LLM) es una red neuronal masiva, entrenada con terabytes de texto. Durante la inferencia, su único trabajo es estadístico: dada una secuencia de palabras, predecir cuál es la siguiente palabra más probable. 

La magia negra es que, con miles de millones de parámetros (los "pesos" o conexiones entre neuronas), esa simple predicción estadística termina exhibiendo capacidades de razonamiento, traducción y escritura. 

Pero hay un detalle crucial a la hora de correrlos en tu máquina: **el problema central es la memoria, no el poder de procesamiento bruto**. Para predecir una sola palabra, el procesador tiene que cargar todos esos miles de millones de parámetros en memoria, pasarlos por la CPU o GPU, y devolver el resultado. La velocidad a la que se puede mover esa cantidad de datos desde la RAM hasta el procesador (ancho de banda de memoria) es lo que define si el modelo responde al instante o si parece que está pensando en cámara lenta.

## Por qué cuantización

Los modelos de lenguaje se entrenan originalmente usando números de punto flotante de 16 o 32 bits (FP16 o FP32). En FP16, un modelo de 8 billones de parámetros (8B) pesa unos 16 GB. Si querés correrlo, necesitás cargar esos 16 GB enteros en tu memoria RAM o VRAM. 

Acá es donde entra la **cuantización**, que es básicamente compresión con pérdida aplicada a los pesos del modelo. Reducimos la precisión de esos números (por ejemplo, a 4 u 8 bits). 

El mismo modelo de 8B cuantizado en formato de 4 bits pesa apenas ~4.5 GB. La degradación en la calidad de las respuestas suele ser imperceptible para uso general, pero la ganancia en velocidad e impacto en memoria es abismal.

### El formato GGUF
`GGUF` es el estándar actual diseñado específicamente para el ecosistema de `llama.cpp`. Si ves un archivo con extensión `.gguf`, es un modelo cuantizado listo para usar.

Vas a ver nombres raros como `Q4_K_M` o `Q8_0`. Estas son las recetas de cuantización:
- **Q8_0**: 8 bits. Casi idéntico al modelo original en calidad, pero pesa el doble que Q4.
- **Q4_K_M**: 4 bits (con bloques mixtos). **Esta es la regla de oro**. Es el "sweet spot" absoluto entre uso de memoria, velocidad y calidad de respuesta para casi cualquier modelo.
- **Q5_K_M**: 5 bits. Un pelín más inteligente que Q4, un pelín más pesado.

## Hardware mínimo

El cuello de botella absoluto es dónde ponés el modelo. Si va todo a la RAM normal (y procesa la CPU), la inferencia se arrastra. Si lográs meter parte o todo el modelo en la VRAM de la placa de video (GPU offloading), vuela.

En mi máquina tengo 38 GB de RAM y una placa con 6 GB de VRAM. Esto me permite jugar bastante.

| Tamaño del Modelo | Memoria (Q4_K_M) | RAM Recomendada | VRAM Ideal (Total offload) | Hardware del autor corre: |
|-------------------|------------------|-----------------|----------------------------|---------------------------|
| 1.5B a 3B         | ~2 a 3 GB        | 8 GB            | 4 GB                       | ✅ Excelente (Total GPU) |
| 7B a 8B           | ~4.5 a 5 GB      | 16 GB           | 6 a 8 GB                   | ✅ Muy bien (Casi total) |
| 14B a 32B         | ~9 a 20 GB       | 32 GB           | 12 a 24 GB                 | ⚠️ Parcial GPU + RAM (Lento) |
| 70B               | ~40 GB           | 64 GB           | 48 GB                      | ❌ Imposible sin clúster |

## Instalación de llama.cpp

Existen múltiples formas de tener `llama.cpp` andando. Acá te dejo las más comunes.

### Opción 1: Compilar desde source (La que te enseña qué pasa)
Es ideal en Linux, WSL (Windows) o macOS. Si tenés GPU NVIDIA, necesitas el toolkit de CUDA instalado.

```bash
git clone https://github.com/ggerganov/llama.cpp
cd llama.cpp
mkdir build
cd build
# Si tenés GPU NVIDIA (CUDA):
cmake .. -DGGML_CUDA=ON
cmake --build . --config Release
```

### Opción 2: Binarios precompilados
Si no querés pelear con el compilador, andá a la sección *Releases* del repo de llama.cpp en GitHub y bajá el `.zip` correspondiente a tu sistema (ej. `llama-bXXXX-bin-win-cuda-cu12.2-x64.zip` para Windows con CUDA 12).

### Opción 3: Ollama
Ollama es un wrapper escrito en Go que usa llama.cpp por debajo pero te abstrae de absolutamente todo. Es como el Docker de los LLMs. Instalás el ejecutable y corrés: `ollama run llama3.1`. Para desarrollo rápido es increíble, pero si querés control fino sobre el motor, seguí con llama.cpp puro.

## Descarga de modelos

El lugar para buscar modelos es **HuggingFace**. Al buscar, siempre agregá la palabra "GGUF" para encontrar las versiones cuantizadas (usuarios como *bartowski* o *TheBloke* son los héroes que suben todo cuantizado).

**Modelos recomendados para empezar hoy:**
- `Llama-3.1-8B-Instruct-Q4_K_M.gguf` (Meta): El mejor modelo de 8B general.
- `Qwen2.5-7B-Instruct-Q4_K_M.gguf` (Alibaba): Excelente para código y muy bueno en español.
- `Phi-3.5-mini-instruct-Q4_K_M.gguf` (Microsoft): 3.8B de parámetros, entra en cualquier lado.

Para descargar, podés usar wget, pero recomiendo usar `huggingface-cli` (se instala con `pip install -U "huggingface_hub[cli]"`):

```bash
huggingface-cli download bartowski/Llama-3.1-8B-Instruct-GGUF Llama-3.1-8B-Instruct-Q4_K_M.gguf --local-dir ./modelos
```

## Correr el primer modelo

Con el ejecutable compilado (`llama-cli`) y el modelo bajado, vamos a lanzar nuestra primera inferencia por terminal:

```bash
./llama-cli -m ./modelos/Llama-3.1-8B-Instruct-Q4_K_M.gguf -p "Explicame cómo funciona I2C en tres oraciones." -n 256 -c 2048 -ngl 33
```

### Los parámetros mágicos

- `-m` o `--model`: La ruta al archivo GGUF.
- `-p` o `--prompt`: Tu pregunta o instrucción.
- `-n` o `--predict`: Cantidad máxima de tokens (palabras/sílabas) a generar.
- `-ngl` o `--n-gpu-layers`: **El parámetro más importante.** Le dice cuántas capas de la red neuronal cargar en la VRAM de tu placa de video en lugar de la RAM. Un modelo 8B tiene unas 32 o 33 capas. Si tengo 6GB VRAM, puedo poner `-ngl 33` y offloadearlo al 100%. El rendimiento pasa de 5 tokens/seg (CPU) a 40+ tokens/seg (GPU).
- `-c` o `--ctx-size`: La ventana de contexto (memoria a corto plazo). Cuánto texto viejo recuerda el modelo en una charla. No le pongas 8192 si solo vas a hacerle una pregunta corta. El contexto ocupa memoria RAM cuadráticamente; mantenelo bajo (2048 o 4096) para ahorrar recursos.
- `--temp` (Temperatura): Por defecto 0.8. Controla la aleatoriedad. 0.0 es robótico y exacto, 1.2 es un poeta que alucina fuerte. Para código, usá 0.1 o 0.0.
- `--repeat-penalty`: Por defecto 1.1. Evita que el modelo se trabe repitiendo la misma frase infinitamente.

## Servidor API (OpenAI compatible)

La terminal está buena, pero ¿qué pasa si queremos que nuestro código (o un microcontrolador como un ESP32) hable con el modelo?
En lugar de `llama-cli`, ejecutamos `llama-server`.

```bash
./llama-server -m ./modelos/Llama-3.1-8B-Instruct-Q4_K_M.gguf -c 2048 -ngl 33 --port 8080
```

Esto levanta un servidor HTTP local que expone los mismos endpoints que la API de OpenAI. Podés pegarle desde Python o curl exactamente como si le estuvieras pagando a OpenAI, pero los datos no salen de tu router.

```bash
curl http://localhost:8080/v1/chat/completions -H "Content-Type: application/json" -d '{
  "messages": [{"role": "user", "content": "Hola mundo"}]
}'
```

## Troubleshooting

- **"Esto tarda horas en responder"**: O no pusiste `-ngl`, o le pasaste `-ngl 0`, o no tenés compilado llama.cpp con soporte CUDA/Metal. Toda la matemática pesada está recayendo sobre el pobre procesador central.
- **"Se me queda sin memoria / Out of memory / Segmentation fault"**: Estás intentando cargar un modelo muy grande (ej. uno de 70B en 16GB de RAM) o pusiste un `-c` (context window) absurdo como 32000.
- **"CUDA error / GGML_ASSERT"**: Tus drivers de video están viejos, o la versión de CUDA instalada en el sistema no coincide con la que usaste para compilar llama.cpp.

Levantar un LLM local es empoderador. De repente, la inteligencia artificial ya no es una caja negra alquilada por token; es un binario ejecutándose en tu escritorio, auditable, controlable y enteramente tuyo.
