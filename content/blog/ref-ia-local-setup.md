---
title: "IA local: preparar una prueba con llama.cpp"
date: "2026-09-22"
lang: "es"
summary: "Elegir una compilación, cargar un modelo GGUF y medir memoria y tiempos con una configuración reproducible."
tags: ["ia", "llama-cpp", "llm", "local", "referencia"]
category: "referencia"
---

llama.cpp permite ejecutar modelos compatibles en distintos entornos. Para preparar una prueba, identificá primero tu sistema, el hardware disponible y el archivo del modelo. Conservá esos datos junto con la versión del motor.

## Instalación o compilación

Podés usar una distribución preparada para tu plataforma o compilar el proyecto. Si elegís compilar, seguí las dependencias y opciones del backend que corresponda a tu equipo. La documentación incluye alternativas como CUDA y Vulkan; habilitar una opción no reemplaza la instalación de sus requisitos. [Guía oficial de compilación](https://github.com/ggml-org/llama.cpp/blob/master/docs/build.md).

Antes de descargar un modelo, comprobá que la arquitectura y el formato sean compatibles con la versión instalada. Revisá también su licencia y la procedencia del archivo.

## Tamaño de pesos y memoria total

Una cuenta orientativa para pesos almacenados con una cantidad uniforme de bits es:

`bytes de pesos ≈ cantidad de parámetros × bits por parámetro / 8`

Con ocho mil millones de parámetros y cuatro bits por parámetro, esa cuenta da cuatro mil millones de bytes. Es una aproximación a los pesos, no un presupuesto completo de memoria para ejecutar el modelo.

El archivo puede incluir metadatos y una cuantización que no use el mismo formato para todos los tensores. La ejecución agrega otros consumos. Medí la carga real con el contexto y las opciones que vayas a utilizar.

## Primera ejecución

Consultá la ayuda de `llama-cli` y prepará una consulta breve. Registrá la ruta del modelo, el contexto, el límite de salida y la configuración de GPU. Los nombres y opciones disponibles deben corresponder a tu versión. [Documentación de llama-cli](https://github.com/ggml-org/llama.cpp/tree/master/tools/cli).

En modelos de conversación, revisá la plantilla de chat utilizada. Si la respuesta tiene un formato inesperado, comprobá esa configuración junto con el prompt y la compatibilidad del modelo.

## Medí antes de ajustar

| Observación | Próximo paso |
|---|---|
| El modelo no carga | Revisá el error, la compatibilidad y la memoria disponible. |
| La respuesta demora demasiado | Registrá tiempos y uso de CPU/GPU con la configuración actual. |
| El formato de respuesta es incorrecto | Revisá plantilla, prompt y opciones de salida estructurada. |
| Una consulta extensa falla | Compará el contexto y el consumo con una consulta corta. |

Cambiá una variable por vez y repetí el mismo caso de prueba. Así podés identificar qué ajuste produjo la diferencia.

## Registro mínimo

Guardá la versión del motor, el nombre exacto del modelo, las opciones de ejecución, el equipo y los resultados. Incluí errores y limitaciones junto con las pruebas satisfactorias.

Las estimaciones de memoria sirven para planificar. Los tiempos y resultados que observes en tu equipo son la referencia para decidir si esa configuración alcanza para el proyecto.
