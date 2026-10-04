---
title: "Desarrollar con IA: generar código y revisar decisiones"
date: "2026-09-20"
lang: "es"
summary: "Cómo organizar tareas, revisar código generado y comprobar que una solución funciona en el entorno del proyecto."
tags: ["ia", "opinión", "democratización", "web", "trabajo"]
category: "referencia"
---

Un proyecto como HIOS combina interfaz, documentación, firmware y pruebas. Las herramientas de IA pueden ayudar a preparar cambios en esas áreas, pero cada entrega necesita una revisión que conecte el código con el comportamiento esperado.

La cantidad de código generado no indica cuánto avanzó el proyecto. Una función sirve cuando resuelve la tarea, encaja en la arquitectura y puede comprobarse en el entorno donde va a ejecutarse.

## Pedí cambios que puedas revisar

Una tarea acotada facilita detectar supuestos incorrectos. En lugar de pedir un sistema completo de telemetría, definí primero un paso: interpretar un paquete, validar sus campos o mostrar una lectura.

Incluí en el pedido:

- El resultado esperado y un ejemplo de entrada y salida.
- Las versiones del lenguaje, framework y bibliotecas.
- Las restricciones del dispositivo o del navegador.
- Los casos de error que la solución debe contemplar.

Por ejemplo: «Implementá un parser para este paquete de ocho bytes. Rechazá entradas incompletas y valores fuera del rango definido. Agregá pruebas para esos casos». El formato del paquete y sus rangos deben acompañar el pedido; el modelo no debería inventarlos.

## Revisá las decisiones, además de la sintaxis

Compilar es un primer control. Después hay que comprobar qué hace el programa con datos reales, errores y dependencias que no responden.

| Área | Qué revisar |
|---|---|
| Interfaz | Estados de carga, errores, navegación, accesibilidad y tamaños de pantalla. |
| Datos y servicios | Validación de entradas, permisos y comportamiento ante respuestas inesperadas. |
| Firmware | Compatibilidad de las APIs, memoria disponible, tiempos de espera y manejo de fallos. |
| Documentación | Correspondencia entre las instrucciones, el código y la versión publicada. |

Para una API que no reconocés, buscá su declaración en la biblioteca instalada y contrastá sus argumentos con la documentación de esa versión. No deduzcas que existe porque el nombre parezca razonable.

## Probá en el entorno de destino

En firmware, revisá el tamaño y la duración de los buffers, la configuración de las tareas y qué ocurre cuando falla un periférico. Un ejemplo aislado no demuestra que el conjunto funcione en la placa elegida.

En una aplicación web, recorré la interacción completa. Un formulario puede renderizar correctamente y fallar al guardar, recuperar la sesión o mostrar una respuesta de error.

Las pruebas deben cubrir el comportamiento que importa, incluidos los límites. Si una prueba repite las mismas suposiciones del código generado, puede pasar sin detectar el problema.

## Un flujo de trabajo revisable

1. Definí una tarea y sus criterios de aceptación.
2. Pedí o implementá un cambio acotado.
3. Revisá dependencias, decisiones y manejo de errores.
4. Ejecutá las comprobaciones pertinentes.
5. Probá la interacción o el dispositivo completo.
6. Documentá lo verificado y lo que todavía queda pendiente.

Si el cambio es demasiado grande para entenderlo, dividilo por comportamientos. La meta es poder explicar qué cambió, por qué y cómo se comprobó.
