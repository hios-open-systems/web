---
title: "Companion del PAD: estado del equipo y controles por red local"
date: "2026-06-24"
lang: "es"
summary: "Qué información envía el companion al PAD, qué controles agrega y qué funciones siguen disponibles sin él."
tags: ["companion", "arquitectura", "local-first"]
category: "devlog"
---

El PAD puede enviar atajos por USB o Bluetooth sin conocer el estado real de la computadora. Por ejemplo, una orden para cambiar el volumen no le informa automáticamente cuál fue el valor final.

El companion agrega ese canal de información. Es un programa de Node y TypeScript que se ejecuta en la computadora, consulta los datos disponibles y los envía al PAD por la red local.

## Qué información envía

El programa utiliza `POST /api/state` con un intervalo configurable mediante `pollMs`. Puede enviar volumen, estado del micrófono y datos de carga o temperatura de CPU y GPU, según los proveedores y sensores disponibles.

La configuración permite elegir qué campos enviar. Un dato ausente no debería interpretarse como una medición de cero: puede indicar que el equipo no lo expone o que no se pudo obtener.

## Qué funciones requieren el companion

| Función | Requisito |
|---|---|
| Atajos de teclado, mouse y multimedia | Conexión HID por USB o BLE. |
| Estado real del equipo en pantalla | Companion y conexión de red. |
| Alternar el mute global del micrófono | Companion y soporte del sistema operativo. |
| Editor web y espejo de la interfaz | Companion configurado y accesible. |

El firmware vuelve a su estado estimado cuando deja de recibir información reciente. Ese estado representa las acciones del PAD, no una confirmación del sistema operativo.

## Comandos de vuelta

El PAD puede solicitar una acción al companion en la respuesta de `POST /api/state`. El companion la procesa y comunica el estado obtenido en las siguientes actualizaciones.

El mute global del micrófono es distinto de un atajo enviado a una aplicación. Los controles de reuniones y cámara dependen de la aplicación activa y de los atajos configurados.

## Cómo prepararlo

Seguí el README del companion para compilarlo. Configurá la dirección del PAD, el token generado por el firmware y el intervalo de consulta. Ambos equipos deben poder comunicarse por la red.

Hay proveedores implementados para Windows y Linux. macOS sigue pendiente. Las instrucciones incluyen opciones de inicio automático para Windows y un servicio de usuario para Linux.

Antes de dar por terminada la configuración, comprobá qué datos recibe la pantalla y qué ocurre al detener el companion. Así podés distinguir las acciones HID de las funciones que dependen de la conexión.
