---
title: "Guía de modelos abiertos: qué hay, qué sirve, qué corre en tu PC"
date: "2026-09-22"
lang: "es"
summary: "Mapa de los modelos de lenguaje abiertos en 2026: familias, licencias, tamaños y cuáles valen la pena para correr en hardware doméstico."
tags: ["ia", "open-source", "modelos", "huggingface", "referencia"]
category: "referencia"
---

El paisaje de la inteligencia artificial abierta cambia de manera violenta. Lo que hoy es el modelo líder indiscutido (state-of-the-art), en dos meses pasa a ser el modelo de base para experimentos de nicho. 

Mantener el ritmo de qué modelos existen, qué licencias tienen y cuáles realmente podés correr en tu casa sin que tu computadora se derrita, es un trabajo en sí mismo. En esta guía de referencia dejamos un mapa de situación del ecosistema de modelos de lenguaje "abiertos" para correr localmente.

## El ecosistema actual

A fecha de hoy, el ecosistema está dominado por un par de familias enormes. Cada familia suele lanzar el mismo modelo en distintos "tamaños" (cantidad de parámetros) para abarcar desde celulares hasta clústers de servidores.

| Familia | Empresa / Organización | Tamaños principales | Licencia | Fortaleza Principal |
|---------|------------------------|---------------------|----------|---------------------|
| **Llama 3.x** | Meta | 8B, 70B, 400B | Community License | Uso general, enorme ecosistema de comunidad, muy estable. |
| **Qwen 2.5** | Alibaba | 0.5B a 72B | Apache 2.0 | Soporte multilingüe excelente (muy buen español), código. |
| **Phi-3/4** | Microsoft | 3.8B, 14B | MIT | Extremadamente eficientes para su tamaño (ideal laptops). |
| **Mistral/Mixtral** | Mistral AI | 7B, 8x7B (MoE) | Apache 2.0 | Arquitectura Mixture of Experts. Rápidos y precisos. |
| **Gemma 2** | Google | 2B, 9B, 27B | Gemma License | Arquitectura potente, amigables para research y experimentación. |
| **DeepSeek** | DeepSeek | V2, Coder, Math | MIT | Absolutamente imbatibles en generación de código y matemática. |
| **Yi** | 01.AI | 6B, 34B | Apache 2.0 | Muy buena ventana de contexto, bilingüe Chino/Inglés fuerte. |

## Open weights vs. true open source

Es importante hacer una distinción técnica y filosófica que la industria suele embarrar a propósito por marketing. Cuando leés "Open Source AI" en una nota de prensa, el 99% de las veces te están mintiendo. 

- **Open Weights (Pesos abiertos):** La corporación de turno gasta 10 millones de dólares en entrenar un modelo y luego libera el archivo final compilado (los "pesos" o parámetros de la red neuronal). Vos podés bajar ese archivo, usarlo y correrlo gratis. Pero la "receta" es un secreto de estado. No tenés acceso al código de entrenamiento, ni a los datos que usaron para entrenarlo (el dataset), y no podés reproducir el proceso desde cero. Esto es lo que hacen Meta (Llama), Google (Gemma) o Alibaba (Qwen). Es un regalo tremendo para la comunidad, pero **no es open source**.
- **True Open Source:** Te entregan todo. Los pesos del modelo, el código de la arquitectura, los scripts de entrenamiento, el paper con la metodología detallada y, crucialmente, el dataset original de terabytes de texto limpiado con el que se entrenó. Modelos como *OLMo* (del Allen Institute) o ciertos proyectos de *EleutherAI* entran acá. 

**¿Por qué importa?**
Porque si no podés ver el dataset, no podés auditar cómo "piensa" el modelo. No podés verificar sesgos de origen, no sabés si le inyectaron material con copyright y si querés mejorar su comportamiento de base, estás trabajando con una caja negra. 

## Qué corre en tu PC

Todo suena muy lindo hasta que ves el tamaño de los archivos. Para correr un modelo en tu computadora usando motores de inferencia locales (como `llama.cpp`), el modelo tiene que cargarse en tu memoria RAM o VRAM (la memoria de la placa de video). 

Acá te dejo una tabla rápida basada en hardware doméstico (asumiendo que usamos modelos cuantizados a **Q4_K_M** o **Q5**, que reducen enormemente el tamaño sin perder casi calidad).

- **Si tenés 8 GB RAM / Sin placa de video:**
  - Estás limitado a modelos experimentales pequeños (1B a 3B). 
  - *Sugerencias:* `Qwen2.5-1.5B`, `Gemma-2-2B`, `Phi-3.5-mini` (3.8B, puede andar lento).
  - *Expectativa:* Sirven para tareas muy específicas (resumir un texto corto, corregir gramática), pero no tienen profundidad de razonamiento ni pueden seguir instrucciones complejas en cadena.

- **Si tenés 16 GB RAM / 6-8 GB VRAM (El sweet spot doméstico):**
  - Podés correr el núcleo del ecosistema: los modelos de **7B y 8B**. 
  - *Sugerencias:* `Llama-3.1-8B-Instruct`, `Qwen2.5-7B`, `Mistral-7B-Instruct`.
  - *Expectativa:* Corren muy rápido (si hacés GPU offload), tienen excelente razonamiento lógico, manejan muy bien el código y la traducción. Son los caballos de batalla para el 90% de los proyectos locales.

- **Si tenés 32-64 GB RAM / 12-24 GB VRAM (Entusiastas):**
  - Entrás a la liga de los modelos medianos pesados: **14B a 34B**.
  - *Sugerencias:* `Qwen2.5-32B`, `Command-R` (35B), `Mixtral-8x7B`.
  - *Expectativa:* Capacidad de razonamiento brutal, casi al nivel de modelos comerciales grandes, pero requieren que armes la PC pensando en esto.

## Dónde encontrar modelos

- **HuggingFace (El GitHub del Machine Learning):** Es el hub central. Buscá la pestaña "Models". Si vas a usar llama.cpp, asegurate de buscar el nombre del modelo seguido de "GGUF" en la barra de búsqueda.
- **TheBloke / bartowski:** Estos son usuarios (o equipos) legendarios en HuggingFace. Su trabajo es agarrar los modelos gigantes apenas salen y empaquetarlos en decenas de versiones cuantizadas (.gguf) listas para que nosotros las descarguemos. Si bartowski subió un repositorio, sabés que funciona.
- **Ollama Library:** Si usás el wrapper de Ollama en vez de lidiar con binarios a mano, tienen su propio registro oficial de modelos probados que podés bajar con un simple comando (`ollama pull llama3.1`). 

## Cómo aportar al ecosistema

La era de la IA abierta está siendo definida ahora mismo. Si querés pasar de consumir a aportar, hay varios frentes:
1. **Crear datasets locales:** Faltan (y mucho) datasets de alta calidad en español local (Argentina, Chile, México). Compilar y limpiar corpus de texto público y abierto para entrenar modelos futuros es oro puro.
2. **Hacer fine-tuning:** Podés usar técnicas de bajo consumo como LoRA o QLoRA para agarrar un modelo como Llama 3 de 8B y entrenarlo específicamente con tu código de Arduino o tu documentación de proyectos.
3. **Contribuir a los motores:** Proyectos como `llama.cpp`, `vLLM` u `Ollama` siempre necesitan testeo en distinto hardware, reportes de bugs o mejoras en el código.

Explorar el ecosistema es abrumador al principio, pero descargar tu primer Llama 8B, desconectar el cable de red y ver cómo tu computadora razona y genera código estando totalmente offline, es una experiencia que te cambia la perspectiva sobre hacia dónde va el software.
