---
title: "Guía de modelos abiertos: qué hay, qué sirve, qué corre en tu PC"
date: "2026-09-22"
lang: "es"
summary: "Mapa de modelos locales en 2026: Llama, Qwen, VLMs, modelos de código, gramáticas BNF y requerimientos de hardware real."
tags: ["ia", "open-source", "modelos", "huggingface", "referencia"]
category: "referencia"
---

El ecosistema local cambia tan rápido que un modelo state-of-the-art hoy es historia en tres meses. En vez de perseguir el hype, lo que importa es entender qué familias sirven para qué tarea y qué podés meter físicamente en tu hardware sin quemar nada.

## El ecosistema actual

- **Llama 3.x (Meta):** El estándar de facto. 8B es el caballo de batalla, 70B si tenés hardware.
- **Qwen 2.5 (Alibaba):** Bilingüe perfecto (inglés/español) y destrozan benchmarks en su tamaño.
- **Qwen2.5-Coder / DeepSeek Coder:** Modelos especializados en código. Para integrarlos en un IDE o generar scripts.
- **VLMs (Vision Language Models):** Modelos que ven. **Moondream2** (minúsculo, 1.8B) o **Qwen2-VL**. Claves para pasarle imágenes de un ESP32-CAM y preguntarle "¿hay un auto en esta foto?".

## Structured Output: Forzar JSON por fuerza bruta

Si un LLM te devuelve texto libre en lugar de un JSON válido para tu código, estás frito. La solución no es rogarle en el prompt, es forzarlo a nivel motor de inferencia usando gramáticas BNF (Backus-Naur Form). 

Motores como `llama.cpp` soportan el parámetro `--grammar` o `--json-schema`. Esto intercepta las probabilidades en cada token y pone en cero cualquier caracter que rompa el JSON, asegurando que la salida de un Qwen2.5-Coder compile y parsee el 100% de las veces.

## Dónde buscar GGUFs

Olvidate de compilar pesos vos mismo. Andá a **HuggingFace** y buscá el modelo cuantizado. Los empaquetadores clave actuales son **bartowski** y **mradermacher**. Si ellos suben un `.gguf`, sabés que anda. (TheBloke quedó en el pasado).

## Hardware real: qué corre en tu PC

Asumiendo que usamos modelos cuantizados a **Q4_K_M** o **Q5** para no desperdiciar memoria:

- **2GB VRAM / Raspberry Pi 5:** Modelos minúsculos o VLMs. Moondream2 (1.8B), Qwen2.5-1.5B. Tareas: clasificar texto básico, mirar fotos chicas.
- **6GB VRAM / 16GB RAM:** El sweet spot maker. Entran perfecto los 7B y 8B con GPU offload total. Llama-3.1-8B o Qwen2.5-7B-Coder. Tareas: generar código, razonamiento lógico, chat fluido.
- **12GB+ VRAM / 32GB RAM:** Los medianos pesados. 14B a 34B. Command-R, Qwen2.5-32B. Tareas: RAG complejo, análisis de documentos largos.

## Trampas comunes

- **Falsos Open Source:** Meta o Google liberan "Open Weights" (los pesos finales). True Open Source (como OLMo) incluye el dataset original y los scripts de entrenamiento. Si no podés ver el dataset, es una caja negra, tenelo en cuenta.
- **Comerse la VRAM con el contexto:** Podés cargar un 8B en 6GB de VRAM, pero si le pasás un PDF de 100 páginas (contexto gigante), explotás la memoria.
- **Usar modelos de chat para código:** Un modelo general charla mucho. Si querés que devuelva solo C++ para el ESP32, usá modelos `Coder` y forzá la salida.

## Chuleta

| Tarea | Familia recomendada |
|---|---|
| Razonamiento general y chat | Llama 3.1 (8B) |
| Programación y autocompletado | Qwen2.5-Coder (7B), DeepSeek Coder |
| Procesar imágenes (ESP32-CAM) | Moondream2, Qwen2-VL |
| Hardware hiper limitado (<2GB) | Qwen2.5-1.5B, Phi-3.5-mini |
| Forzar salida JSON | Usar `--grammar` o `--json-schema` en llama.cpp |
