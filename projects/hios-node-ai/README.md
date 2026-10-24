# HIOS Node AI — Consultas a Ollama desde un ESP32-S3

> **Esquema de cableado, netlist y BOM (CSV):** [`hardware/`](hardware/). Se generan desde los datos verificados contra el firmware.

Prototipo con **ESP32-S3** que envía una consulta de texto predefinida a un servidor **Ollama** al pulsar un botón. Una pantalla OLED muestra el estado de la solicitud y la respuesta. El modelo se ejecuta en el servidor de la red local.

## Funciones disponibles

- **Consulta por WiFi:** envío HTTP al endpoint `/api/chat` de Ollama.
- **Botón físico:** inicia la consulta configurada en el firmware.
- **Pantalla OLED:** muestra estado, respuesta y errores en una SSD1306 por I2C.
- **Tarea de red:** FreeRTOS ejecuta la solicitud HTTP mientras el bucle principal actualiza la pantalla.
- **Batería:** una 18650 con carga USB-C (TP4056) y boost a 5V (Pololu U3V40F5); la tensión se muestra en el OLED.
- **Beep de confirmación:** el MAX98357A suena al arrancar y al llegar cada respuesta.
- **Configuración por `build_flags`:** red WiFi, servidor y modelo se definen en `platformio.ini`, no en el código.

## Alcance actual

El micrófono INMP441 queda cableado (GPIO40–42) pero el firmware todavía no lo lee: la consulta por voz necesita además un servidor de transcripción en la PC, porque Ollama solo recibe texto. No hay inferencia TinyML. El diseño no fue armado ni compilado todavía. No hay una medición publicada de latencia, tasa de actualización de pantalla o autonomía.

## Primeros pasos

1. Cloná el repositorio y entrá en `projects/hios-node-ai`.
2. Abrí el proyecto en **PlatformIO** (VS Code).
3. Prepará un servidor **Ollama** con el modelo descargado y una dirección accesible desde el ESP32-S3 en tu red local.
4. Configurá la red WiFi, la dirección de la API y el modelo en `build_flags` de `platformio.ini` (sin commitear tus credenciales). El texto de la consulta está en `src/main.cpp`.
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
