---
title: "ESP-NOW: comunicación entre ESP32 sin router"
date: "2026-07-23"
lang: "es"
summary: "Cómo configurar pares, canal, mensajes y cifrado, y distinguir la recepción por radio del procesamiento en la aplicación."
tags: ["esp32", "esp-now", "wireless", "referencia"]
category: "referencia"
---

ESP-NOW es un protocolo de Espressif que intercambia tramas de acción 802.11 específicas del fabricante, sin establecer una conexión IP. Permite comunicar dispositivos compatibles por dirección MAC, mediante unicast o broadcast, sin necesitar un router. Medí la latencia y la entrega de mensajes en las condiciones de tu montaje.

## Cuándo conviene (y cuándo no)

| Escenario | Alternativa a evaluar |
|---|---|
| Mensajes cortos entre placas cercanas | ESP-NOW |
| Acceso a internet / MQTT / HTTP | WiFi (STA) |
| Hablar con un celular | BLE |
| Red de nodos con enrutamiento | ESP-WIFI-MESH o Thread, según el hardware |

ESP-NOW puede ser útil para mensajes cortos de sensores, controles remotos o botoneras. Confirmá que todos los equipos admitan el protocolo; no reemplaza una conexión IP ni permite comunicarse directamente con cualquier teléfono o servicio web.

## Unicast, broadcast y peers

- **Unicast**: mandás a la MAC de un peer registrado. Hay confirmación a nivel MAC (ACK de 802.11), y el callback informa el resultado de esa entrega. Esto no confirma que la aplicación haya procesado el mensaje.
- **Broadcast**: mandás a `FF:FF:FF:FF:FF:FF`. No ofrece cifrado ESP-NOW ni confirmación individual de recepción. Registrá también la dirección de broadcast antes de enviar.
- Antes de mandar unicast hay que **registrar el peer** (`esp_now_add_peer`) con su MAC, canal e interfaz. La documentación de ESP-IDF para ESP32 indica hasta **20 pares**, con un límite separado y configurable para los cifrados. Verificá la configuración y la versión de ambos equipos.

## Canal de comunicación

Todos los nodos tienen que estar en el **mismo canal WiFi**. Revisá este dato al diagnosticar un problema de comunicación:

- Si el ESP32 está solo en modo STA sin conectarse a nada, el canal es el que vos fijes (`esp_wifi_set_channel`).
- Si además se conecta a un AP, **el canal lo decide el AP**, y puede cambiar. Tus peers ESP-NOW tienen que seguirlo.

Coexistir con WiFi es posible (ESP-NOW comparte la radio), pero el canal es uno solo: o fijás todo en el mismo, o los nodos que no están asociados al AP tienen que descubrir el canal (por ejemplo, escaneando o con un beacon propio por broadcast).

## Payload

El payload máximo clásico es de **250 bytes por frame**. ESP-NOW v2 (en versiones recientes de ESP-IDF) amplía ese límite hasta 1470 bytes, pero si necesitás interoperar con firmware viejo, asumí 250. Para mensajes más grandes: fragmentar y rearmar a mano, con número de secuencia.

## Cifrado

ESP-NOW cifra unicast con **CCMP** usando dos claves:

- **PMK** (Primary Master Key): global, se setea una vez con `esp_now_set_pmk`.
- **LMK** (Local Master Key): por peer, va en la estructura del peer con `encrypt = true`.

Broadcast no admite el cifrado de ESP-NOW. Para mensajes que lo requieran, configurá unicast cifrado o diseñá una protección a nivel de aplicación. Usar unicast sin configurar las claves no activa el cifrado.

## Prepará un ejemplo compatible

Usá el ejemplo de ESP-NOW correspondiente a tu versión de ESP-IDF o Arduino-ESP32. Las firmas de los callbacks pueden cambiar entre versiones; contrastalas con los encabezados instalados.

El recorrido de configuración incluye iniciar WiFi, inicializar ESP-NOW, registrar callbacks y agregar los pares antes de enviar datos. Comprobá el resultado de cada operación y registrá los errores.

En recepción, validá longitud y formato antes de interpretar un mensaje. Si el trabajo requiere tiempo, pasalo a una tarea de procesamiento para que el callback termine pronto.

La [referencia oficial de ESP-NOW](https://docs.espressif.com/projects/esp-idf/en/stable/esp32/api-reference/network/esp_now.html) documenta versiones, límites de mensajes, cifrado y callbacks. Verificá esos límites para ambos extremos de la comunicación.

## Puntos de diagnóstico

- **Canal fijo vs STA que cambia de canal**: si un nodo se asocia a un AP, arrastra el canal. Los nodos que permanezcan en otro canal pueden dejar de comunicarse.
- **Bloquear en los callbacks**: tanto el de envío como el de recepción corren en el contexto de la task de WiFi. Nada de `delay()`, prints largos ni trabajo pesado: copiá el payload a una cola (FreeRTOS queue) y procesá en otra task.
- **Confundir ACK con entrega a la app**: `ESP_NOW_SEND_SUCCESS` significa que la radio del otro lado confirmó el frame, no que tu lógica lo consumió.
- **Ahorro de energía:** comprobá cómo afecta a la recepción en tu configuración y definí confirmaciones o reintentos si la aplicación los requiere.
- **Formato de datos:** definí tamaños, orden de bytes y versión del mensaje. No asumas que una estructura en memoria tiene la misma representación en todas las placas.
