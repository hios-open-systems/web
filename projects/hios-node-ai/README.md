# HIOS Node AI — Cliente de Voz y Audio para IA Local

Nodo de escritorio abierto basado en **ESP32-S3 (N16R8)** para interactuar con servidores de Inteligencia Artificial locales (Ollama / `llama.cpp` / LM Studio) mediante comandos de voz y pantalla OLED, o ejecutar modelos **TinyML / ESP-SR (WakeNet)** de forma autónoma.

## Features

- **Cerebro Delegado por WiFi**: Se conecta directamente a la API `/api/chat` de tu PC local sin depender de servidores en la nube.
- **Microprocesador ESP32-S3**: Dual-core a 240 MHz con aceleración por instrucciones vectoriales para inferencia de Machine Learning.
- **Entrada de Audio I2S**: Micrófono digital INMP441 con captura PCM a 16kHz de bajo ruido.
- **Salida de Audio I2S**: Amplificador DAC MAX98357A de 3.2W en Clase D para respuestas sintetizadas y alertas auditivas.
- **Display OLED I2C**: Pantalla SSD1306 0.96" que muestra el estado ("Listo", "Pensando", "Respuesta") a 60 FPS.
- **Firmware No Bloqueante**: Multitarea con FreeRTOS pineada al Core 0 (red) y Core 1 (UI/físico).
- **Alimentación Autónoma**: Batería Li-Ion 18650 con módulo de carga USB-C TP4056 y regulador de voltaje.

## Quick Start

1. Clonar el repositorio y navegar a `projects/hios-node-ai`.
2. Abrir en **PlatformIO** (VSCode).
3. Asegurarse de tener un servidor **Ollama** corriendo en tu red local expuesto en `0.0.0.0` (`OLLAMA_HOST=0.0.0.0`).
4. Configurar tus credenciales de WiFi e IP de tu PC en `src/main.cpp`.
5. Compilar y flashear el ESP32-S3 vía USB-C:
   ```bash
   pio run -t upload
   ```
6. Presionar el botón físico en el GPIO 4 para enviar la consulta al LLM local.

## Documentación Técnica

- [Especificaciones de Componentes (COMPONENTS.md)](COMPONENTS.md)
- [Diagrama de Conexiones y Pinout (PINOUT.md)](PINOUT.md)
- [Guía de Ensamblado Paso a Paso (ASSEMBLY.md)](ASSEMBLY.md)
- [Solución de Problemas y Diagnósticos (TROUBLESHOOTING.md)](TROUBLESHOOTING.md)
