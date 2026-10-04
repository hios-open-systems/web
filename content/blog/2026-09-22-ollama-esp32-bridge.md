---
title: "Conectar HIOS Node AI con Ollama por WiFi"
date: "2026-09-24"
lang: "es"
summary: "Preparar el servidor, comprobar la API y configurar el prototipo ESP32-S3 que muestra respuestas en una pantalla OLED."
tags: ["ia", "esp32", "ollama", "local-first", "tutorial"]
category: "devlog"
---

El firmware de HIOS Node AI envía una consulta de texto predefinida a Ollama al pulsar un botón. La respuesta aparece en una pantalla OLED SSD1306. El ESP32-S3 se ocupa de la interacción y la comunicación; el modelo se ejecuta en otro equipo.

El código de referencia está en `projects/hios-node-ai/src/main.cpp`. La captura de voz, la reproducción de audio y TinyML siguen pendientes.

## Prepará el servidor

Instalá Ollama en el equipo que ejecutará el modelo y comprobá primero una consulta desde ese equipo. Elegí un modelo local que puedas cargar con la memoria disponible.

Ollama escucha en `127.0.0.1:11434` de forma predeterminada. Para acceder desde el ESP32, configurá `OLLAMA_HOST` con una dirección accesible desde la red local. El procedimiento depende de si usás la aplicación de escritorio, un servicio o una ejecución manual. [Configuración oficial de Ollama](https://docs.ollama.com/faq).

Limitá el acceso al servidor a los equipos de tu red que deban usarlo. Cambiar la dirección de escucha no configura autenticación ni permisos por sí solo.

## Comprobá la API antes de cargar el firmware

Prepará un archivo `consulta.json`, reemplazando `MODELO_INSTALADO` por el nombre exacto de tu modelo:

```json
{
  "model": "MODELO_INSTALADO",
  "messages": [{ "role": "user", "content": "Explicá brevemente qué es I2S." }],
  "stream": false
}
```

Desde otro equipo de la red, ejecutá la consulta con curl y la dirección del servidor:

```bash
curl http://192.168.1.50:11434/api/chat -H "Content-Type: application/json" --data-binary @consulta.json
```

La dirección es un ejemplo. En Windows, podés usar `curl.exe` si tu terminal reserva `curl` para otro comando.

El endpoint `/api/chat` recibe mensajes de conversación. Con `stream: false`, la respuesta se entrega como un objeto JSON, cuyo contenido se consulta en `message.content`. Revisá también el estado HTTP y los errores devueltos. [Referencia de la API de chat](https://docs.ollama.com/api/chat).

## Configurá el prototipo

Seguí el README y el cableado del proyecto. Antes de compilar, ajustá la red WiFi, la URL de Ollama, el nombre del modelo y la consulta de texto. Confirmá que los pines de la pantalla, el botón y el indicador correspondan a tu montaje.

El firmware realiza la solicitud HTTP en `networkTask`, una tarea de FreeRTOS. El bucle principal atiende la interacción y actualiza la pantalla. Esta separación organiza el trabajo, pero no garantiza un tiempo de respuesta ni elimina los errores de red.

## Probá los estados del dispositivo

| Prueba | Qué observar |
|---|---|
| Servidor y modelo disponibles | Consulta enviada y respuesta en pantalla. |
| Nombre de modelo incorrecto | Estado HTTP o mensaje de error. |
| Servidor apagado | Manejo del fallo de conexión o del tiempo de espera. |
| WiFi desconectado | Indicación de desconexión. |
| Consulta más extensa | Memoria disponible, duración y presentación de la respuesta. |

Registrá la versión del firmware, el modelo y el resultado de cada prueba. Si la API funciona desde una computadora pero no desde el dispositivo, revisá conectividad, configuración y salida del monitor serie antes de cambiar el modelo.
