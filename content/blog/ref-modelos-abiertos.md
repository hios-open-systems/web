---
title: "Modelos locales: cómo evaluar compatibilidad y resultados"
date: "2026-09-22"
lang: "es"
summary: "Qué revisar en la ficha de un modelo, cómo probar el uso de memoria y para qué sirven las salidas estructuradas."
tags: ["ia", "open-source", "modelos", "huggingface", "referencia"]
category: "referencia"
---

Elegir un modelo local requiere mirar la tarea, el equipo y el entorno de ejecución. Una lista de nombres o tamaños no alcanza para saber cómo va a responder en tu proyecto.

## Empezá por la tarea

Prepará ejemplos representativos antes de comparar modelos: preguntas en los idiomas que necesitás, archivos del tipo que vas a procesar o fragmentos de código del proyecto. Definí también cómo vas a reconocer una respuesta incorrecta.

Para una integración con hardware, evaluá por separado la interpretación del pedido y la validación de la acción. Un modelo puede proponer una orden; la aplicación debe decidir si corresponde ejecutarla.

## Leé la ficha del modelo

La ficha o *model card* puede documentar el uso previsto, las limitaciones, la evaluación y la licencia. Revisá qué información publica el autor y qué pruebas faltan para tu caso. Una descripción promocional no reemplaza esa comprobación. [Documentación de model cards de Hugging Face](https://huggingface.co/docs/hub/model-cards).

Si descargás una conversión o una versión cuantizada, registrá también su origen, nombre exacto y revisión. Confirmá que el motor instalado admite ese archivo y su arquitectura.

## Probá la memoria con tu configuración

El contexto es parte de la configuración que necesitás evaluar. Ollama documenta que una ventana de contexto mayor requiere más memoria y permite inspeccionar la ejecución con `ollama ps`. No extrapoles el resultado de una consulta corta a un documento extenso. [Contexto en Ollama](https://docs.ollama.com/context-length).

Para comparar pruebas, anotá:

- Modelo y variante del archivo.
- Versión del motor y equipo utilizado.
- Longitud de contexto configurada.
- Memoria observada durante la carga y la consulta.
- Tiempo hasta la primera respuesta y tiempo total.
- Resultado de los ejemplos de evaluación.

La herramienta de memoria de Workbench muestra escenarios numéricos ilustrativos, con coeficientes simplificados. No valida si un modelo entra en tu equipo: para eso necesitás medir su ejecución real.

## Definí el formato de salida

llama.cpp admite gramáticas GBNF y la conversión de un subconjunto de JSON Schema para restringir el formato generado. Consultá las opciones y limitaciones de la versión que uses. [Guía de gramáticas de llama.cpp](https://github.com/ggml-org/llama.cpp/blob/master/grammars/README.md).

Un formato válido no demuestra que los valores sean correctos. Después de interpretar la respuesta, comprobá campos, rangos y permisos. Contemplá también respuestas incompletas y errores del servidor.

## Conservá una comparación reproducible

| Criterio | Qué registrar |
|---|---|
| Calidad | Ejemplos resueltos y errores encontrados. |
| Compatibilidad | Motor, versión, arquitectura y formato del modelo. |
| Recursos | Memoria y tiempos observados con la configuración probada. |
| Uso permitido | Licencia y condiciones aplicables al archivo elegido. |
| Integración | Formato de respuesta y validaciones de la aplicación. |

Volvé a ejecutar los mismos ejemplos cuando cambies de modelo o actualices el motor. Así podés evaluar el cambio sobre tu trabajo real.
