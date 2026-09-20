---
title: "IA local: inferencia con llama.cpp y modelos cuantizados"
date: "2026-09-22"
lang: "es"
summary: "Setup paso a paso para correr modelos locales: llama.cpp, compilación con CUDA/Vulkan, cálculo de VRAM, offloading y plantillas de chat."
tags: ["ia", "llama-cpp", "llm", "local", "referencia"]
category: "referencia"
---

Correr inferencia local dejó de ser brujería. Con `llama.cpp` y modelos cuantizados en formato GGUF, podés levantar LLMs en hardware doméstico sin depender de la nube. El truco no es tener el procesador más rápido, sino entender cómo mover los pesos a la memoria sin que el sistema colapse.

## Por qué cuantización y formato GGUF

Un modelo entrenado en FP16 de 8 billones de parámetros (8B) pesa unos 16 GB. Si intentás meter eso crudo en RAM, la inferencia se arrastra. La cuantización baja la precisión de los pesos (a 8 o 4 bits) para que el modelo entre en la memoria y el ancho de banda no sea un cuello de botella. 

El formato estándar es **GGUF**. Si ves nombres como `Q4_K_M` o `Q8_0`, son las recetas:
- **Q8_0** (8 bits): Casi idéntico al original, pesa el doble que Q4.
- **Q4_K_M** (4 bits mixto): El sweet spot absoluto. Máximo balance entre memoria y velocidad.

## Cálculo de VRAM: la matemática que no miente

La regla de oro para saber si un modelo entra en tu placa de video es esta fórmula rápida para el tamaño de los pesos:

`VRAM_Pesos (GB) = (Parámetros_en_Billones * Bits_de_Cuantización) / 8`

Ejemplo para un modelo 8B en Q4 (4 bits): `(8 * 4) / 8 = 4 GB`.

Pero **ojo**: a eso hay que sumarle el **KV Context Memory** (la memoria para recordar la charla). Si no cuantizás el caché KV, se te comen 1-2 GB extra rápido. Si tenés una placa de 6GB, offloadear todo (`-ngl 33`) te va a tirar un OOM (Out of Memory) o mandarte a shared RAM (lento). La solución es cuantizar el caché: usá `-ctk q8_0 -ctv q8_0` para achicarlo.

## Compilar llama.cpp

Olvidate de binarios precompilados si querés sacar cada gota de performance. Compilá a pelo usando CMake moderno.

Para NVIDIA (CUDA):
```bash
git clone https://github.com/ggerganov/llama.cpp && cd llama.cpp
cmake -B build -DGGML_CUDA=ON
cmake --build build --config Release
```

Para AMD/Intel (Vulkan):
```bash
cmake -B build -DGGML_VULKAN=1
cmake --build build --config Release
```

## Ejecución y parámetros mágicos

Descargá un modelo GGUF (por ejemplo con `huggingface-cli`) y lanzalo. Para Llama 3.x, es crítico usar el template correcto, si no te comés tokens basura.

```bash
./build/bin/llama-cli -m ./Llama-3.1-8B-Instruct-Q4_K_M.gguf \
  -p "Explicame I2C" -n 256 -c 2048 -ngl 33 \
  --chat-template llama3 -ctk q8_0 -ctv q8_0
```

- `-ngl 33` (o `--n-gpu-layers`): Capas que mandás a la VRAM. Un 8B tiene ~33 capas. Si entra todo, vuela.
- `-c 2048`: Ventana de contexto. Mantenela baja si es una charla corta, crece cuadráticamente en memoria.
- `--chat-template llama3` o `-cnv`: **Indispensable** para que Llama 3.x entienda los roles (user/assistant).

## Trampas comunes

- **OOM silencioso (Shared RAM):** En Windows, si superás tu VRAM, los drivers de NVIDIA mandan el exceso a la RAM normal. La inferencia pasa de 40 tokens/s a 3 tokens/s sin tirar error. Revisá el Task Manager; si tocás memoria compartida, bajá el `-ngl` o cuantizá el KV.
- **Tokens basura / bucles infinitos:** Causado 99% de las veces por no usar la plantilla de chat correcta (`--chat-template`). El modelo no sabe dónde termina tu prompt.
- **Drivers desfasados:** El compilador de CUDA (`nvcc`) y tu driver de pantalla tienen que estar en versiones compatibles, o el ejecutable tira `GGML_ASSERT`.

## Chuleta

| Problema / Necesidad | Solución (parámetro) |
|---|---|
| Acelerar usando placa de video | `-ngl <numero_capas>` (ej. 33 para todo el modelo 8B) |
| No me entra en la VRAM por poco | Cuantizar caché: `-ctk q8_0 -ctv q8_0` |
| El modelo responde basura | Especificar template: `--chat-template llama3` |
| Cortar texto infinito | Limitar salida: `-n 256` |
| Levantar API estilo OpenAI | Usar `./build/bin/llama-server` en vez de `llama-cli` |
