# HIOS Node AI — Ollama queries from an ESP32-S3

> **Wiring schematic, netlist and BOM (CSV):** [`hardware/`](hardware/). Generated from data checked against the firmware.

An **ESP32-S3** prototype that sends a predefined text query to an **Ollama** server when a button is pressed. An OLED screen shows the request status and response. The model runs on a server on the local network.

## Available features

- **WiFi queries:** HTTP requests to Ollama's `/api/chat` endpoint.
- **Physical button:** starts the query configured in the firmware.
- **OLED screen:** displays status, responses and errors on an SSD1306 over I2C.
- **Network task:** FreeRTOS runs the HTTP request while the main loop updates the screen.
- **Battery:** one 18650 with USB-C charging (TP4056) and a 5V boost (Pololu U3V40F5); the OLED shows its voltage.
- **Confirmation beep:** the MAX98357A beeps at startup and when each answer arrives.
- **Configuration via `build_flags`:** WiFi network, server and model are set in `platformio.ini`, not in the code.

## Current scope

The INMP441 microphone is wired (GPIO40–42) but the firmware does not read it yet: voice queries also need a transcription server on the PC, because Ollama only accepts text. There is no TinyML inference. The design has not been built or compiled yet. No measurements of latency, screen refresh rate or battery life have been published.

## Getting started

1. Clone the repository and open `projects/hios-node-ai`.
2. Open the project in **PlatformIO** (VS Code).
3. Prepare an **Ollama** server with the model downloaded and an address reachable by the ESP32-S3 on your local network.
4. Set the WiFi network, API address and model in the `build_flags` of `platformio.ini` (do not commit your credentials). The query text is in `src/main.cpp`.
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
