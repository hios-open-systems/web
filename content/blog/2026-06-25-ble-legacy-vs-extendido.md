---
title: "BLE en el PAD: modos de advertising y diagnóstico"
date: "2026-06-25"
lang: "es"
summary: "Cómo seleccionar advertising legacy, extendido o dual en el firmware del PAD y separar problemas de descubrimiento, conexión y reinicio."
tags: ["esp32", "ble", "firmware"]
category: "devlog"
---

Cuando el PAD no aparece en un escaneo Bluetooth, conviene separar tres situaciones: el equipo no lo descubre, lo descubre pero no conecta, o el dispositivo se reinicia durante la conexión.

El firmware incluye controles por puerto serie para comparar esos estados sin recompilar. La implementación está en `projects/pad/src/transport/BleHidTransport.cpp`.

## Modos disponibles

| Comando serie | Acción |
|---|---|
| `l` | Seleccionar advertising legacy. |
| `e` | Seleccionar advertising extendido. |
| `d` | Seleccionar modo dual. |
| `s` | Mostrar el estado actual. |
| `c` | Borrar los vínculos guardados y reiniciar el advertising. |

El modo predeterminado del código es dual. La presencia de estos modos permite probar compatibilidad con distintos adaptadores y sistemas; no garantiza que todos admitan las mismas formas de descubrimiento o emparejamiento.

## Revisá descubrimiento y conexión por separado

1. Abrí el monitor serie y consultá el estado con `s`.
2. Probá un modo de advertising y ejecutá un nuevo escaneo desde la computadora.
3. Si el PAD aparece, intentá conectar y observá los mensajes del firmware.
4. Registrá adaptador, sistema, versión del firmware y modo utilizado.

Si borrás los vínculos con `c`, vas a necesitar emparejar nuevamente el dispositivo. Revisá también los vínculos guardados en la computadora.

## Reinicios durante el emparejamiento

El código incluye una inicialización explícita de callbacks mediante `setCallbacks(nullptr)`. El comentario de implementación la relaciona con un fallo observado en `NimBLEExtAdvertising`.

Ese detalle debe leerse junto con la versión de NimBLE usada por el proyecto. No corresponde asumir que cualquier fallo de conexión tiene la misma causa ni que el comportamiento se mantiene en todas las versiones.

## Qué registrar para reproducir un problema

Conservá el log serie del reinicio o error, el modo de advertising y la versión de las dependencias. En Linux, una captura de `btmon` puede aportar información del lado del equipo.

Comparar esos registros ayuda a localizar en qué etapa falla la conexión y evita tratar un reinicio del dispositivo como si fuera solamente un problema de escaneo.
