# HIOS Node AI — Consultas a Ollama desde un ESP32-S3

Prototipo con **ESP32-S3** que envía una consulta de texto predefinida a un servidor **Ollama** al pulsar un botón. Una pantalla OLED muestra el estado de la solicitud y la respuesta. El modelo se ejecuta en el servidor de la red local.

## Funciones disponibles

- **Consulta por WiFi:** envío HTTP al endpoint `/api/chat` de Ollama.
- **Botón físico:** inicia la consulta configurada en el firmware.
- **Pantalla OLED:** muestra estado, respuesta y errores en una SSD1306 por I2C.
- **Tarea de red:** FreeRTOS ejecuta la solicitud HTTP mientras el bucle principal actualiza la pantalla.
- **Configuración en código:** red WiFi, servidor y modelo definidos antes de compilar.

## Alcance actual

El firmware de `src/main.cpp` no implementa captura de voz, salida de audio ni inferencia TinyML. Los módulos de audio descritos en los documentos de diseño corresponden a ampliaciones previstas. No hay una medición publicada de latencia, tasa de actualización de pantalla o autonomía.

## Primeros pasos

1. Cloná el repositorio y entrá en `projects/hios-node-ai`.
2. Abrí el proyecto en **PlatformIO** (VS Code).
3. Prepará un servidor **Ollama** con el modelo descargado y una dirección accesible desde el ESP32-S3 en tu red local.
4. Configurá la red WiFi, la dirección de la API, el modelo y el texto de la consulta en `src/main.cpp`.
5. Compilá y cargá el firmware en el ESP32-S3 por USB-C:
   ```bash
   pio run -t upload
   ```
6. Presioná el botón físico en el GPIO 4 para enviar la consulta al LLM local.

## Documentación técnica

- [Especificaciones de Componentes (COMPONENTS.md)](COMPONENTS.md)
- [Diagrama de Conexiones y Pinout (PINOUT.md)](PINOUT.md)
- [Guía de Ensamblado Paso a Paso (ASSEMBLY.md)](ASSEMBLY.md)
- [Solución de Problemas y Diagnósticos (TROUBLESHOOTING.md)](TROUBLESHOOTING.md)
