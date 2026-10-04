---
title: "TinyML en ESP32-S3: cómo preparar una prueba"
date: "2026-09-23"
lang: "es"
summary: "Elegir un ejemplo compatible, revisar memoria y medir resultados antes de integrar inferencia en un dispositivo."
tags: ["ia", "tinyml", "esp32", "tensorflow-lite", "referencia"]
category: "referencia"
---

Una prueba de TinyML necesita una tarea concreta: clasificar una señal, reconocer un patrón o detectar un evento. Definí la entrada, el resultado esperado y el tiempo disponible para responder antes de elegir el modelo.

Esta guía es una referencia para experimentar. TinyML y la captura de voz todavía no están implementados en el firmware actual de HIOS Node AI, que consulta Ollama en otro equipo.

## Partí de un ejemplo compatible

Espressif mantiene el componente `esp-tflite-micro` para ESP-IDF, con ejemplos como `hello_world`, `micro_speech` y `person_detection`. Su documentación indica versiones admitidas, pasos de compilación e integración con ESP-NN. Elegí un ejemplo que corresponda a tu placa y seguí su README. [Repositorio oficial de esp-tflite-micro](https://github.com/espressif/esp-tflite-micro).

Para reconocimiento de voz, consultá también ESP-SR. Su guía separa componentes como WakeNet y MultiNet y documenta sus requisitos. Confirmá los modelos, idiomas y placas admitidos antes de diseñar la interacción. [Guía oficial de ESP-SR para ESP32-S3](https://docs.espressif.com/projects/esp-sr/en/latest/esp32s3/index.html).

## Revisá la configuración de memoria

El tamaño del archivo del modelo no describe todo el consumo de la aplicación. También necesitás considerar los buffers de entrada, la memoria de trabajo del intérprete y el resto del firmware.

No uses una regla universal como «la arena debe ir siempre en SRAM» para dar por resuelto el diseño. Registrá la ubicación y el tamaño de los buffers, ejecutá el ejemplo y medí el resultado en la placa elegida.

Las cifras de rendimiento publicadas por un proveedor corresponden a un modelo y una configuración determinados. Conservá esas condiciones si querés reproducir la prueba; no las presentes como la latencia de cualquier aplicación.

## Comprobá el recorrido completo

1. Ejecutá el ejemplo original y guardá su salida.
2. Identificá el formato, las dimensiones y el tipo de los datos de entrada.
3. Prepará muestras conocidas y verificá el preprocesamiento.
4. Ejecutá la inferencia y revisá cómo se interpreta la salida.
5. Medí memoria y tiempo de respuesta con los demás componentes activos.
6. Probá entradas inesperadas y fallos de inicialización.

Si cambiás el modelo o su cuantización, repetí la evaluación. La aplicación debe interpretar los tensores según el modelo cargado; no corresponde tratar cualquier salida como un número de punto flotante o aplicar un umbral fijo sin validarlo.

## Separá una demostración de una función del producto

Una prueba que reconoce una muestra no demuestra todavía que la función esté lista para uso continuo. Documentá el conjunto de pruebas, las condiciones de captura y los errores observados.

Antes de conectarla con una acción física, definí qué ocurre ante una clasificación dudosa, una demora o un fallo del modelo. Esa lógica forma parte del diseño del dispositivo.
