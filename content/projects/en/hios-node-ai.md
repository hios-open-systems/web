# HIOS Node AI — Ollama queries from an ESP32-S3

An **ESP32-S3** prototype that sends a predefined text query to an **Ollama** server when a button is pressed. An OLED screen shows the request status and response. The model runs on a server on the local network.

## Available features

- **WiFi queries:** HTTP requests to Ollama's `/api/chat` endpoint.
- **Physical button:** starts the query configured in the firmware.
- **OLED screen:** displays status, responses and errors on an SSD1306 over I2C.
- **Network task:** FreeRTOS runs the HTTP request while the main loop updates the screen.
- **Configuration in code:** set the WiFi network, server and model before compiling.

## Current scope

The firmware in `src/main.cpp` does not implement voice capture, audio output or TinyML inference. The audio modules described in the design documents are planned extensions. No measurements of latency, screen refresh rate or battery life have been published.

## Getting started

1. Clone the repository and open `projects/hios-node-ai`.
2. Open the project in **PlatformIO** (VS Code).
3. Prepare an **Ollama** server with the model downloaded and an address reachable by the ESP32-S3 on your local network.
4. Set the WiFi network, API address, model and query text in `src/main.cpp`.
5. Compile and upload the firmware to the ESP32-S3 over USB-C:
   ```bash
   pio run -t upload
   ```
6. Press the physical button on GPIO 4 to send the query to the local LLM.

## Technical documentation

- [Component specifications (COMPONENTS.md)](COMPONENTS.md)
- [Wiring diagram and pinout (PINOUT.md)](PINOUT.md)
- [Assembly guide (ASSEMBLY.md)](ASSEMBLY.md)
- [Troubleshooting (TROUBLESHOOTING.md)](TROUBLESHOOTING.md)
