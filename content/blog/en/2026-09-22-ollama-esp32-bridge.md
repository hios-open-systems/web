---
title: "Connect HIOS Node AI to Ollama over WiFi"
date: "2026-09-24"
lang: "en"
summary: "Prepare the server, check the API and configure the ESP32-S3 prototype that displays responses on an OLED screen."
tags: ["ai", "esp32", "ollama", "local-first", "tutorial"]
category: "devlog"
---

HIOS Node AI firmware sends a predefined text query to Ollama when you press a button. The response appears on an SSD1306 OLED display. The ESP32-S3 handles interaction and communication; the model runs on another computer.

The reference code is in `projects/hios-node-ai/src/main.cpp`. Voice capture, audio playback and TinyML are still pending.

## Prepare the server

Install Ollama on the computer that will run the model and first test a query from that computer. Choose a local model that fits the available memory.

Ollama listens on `127.0.0.1:11434` by default. To access it from the ESP32, configure `OLLAMA_HOST` with an address reachable from the local network. The procedure depends on whether you use the desktop application, a service or a manual invocation. [Official Ollama configuration](https://docs.ollama.com/faq).

Limit server access to the devices on your network that need it. Changing the listening address does not configure authentication or permissions by itself.

## Check the API before flashing the firmware

Create a file named `query.json`, replacing `INSTALLED_MODEL` with the exact name of your model:

```json
{
  "model": "INSTALLED_MODEL",
  "messages": [{ "role": "user", "content": "Briefly explain I2S." }],
  "stream": false
}
```

From another computer on the network, send the query with curl and the server’s address:

```bash
curl http://192.168.1.50:11434/api/chat -H "Content-Type: application/json" --data-binary @query.json
```

The address is an example. On Windows, you can use `curl.exe` if your terminal reserves `curl` for another command.

The `/api/chat` endpoint accepts conversation messages. With `stream: false`, it returns a JSON object whose response text is in `message.content`. Also check the HTTP status and any returned errors. [Chat API reference](https://docs.ollama.com/api/chat).

## Configure the prototype

Follow the project README and wiring instructions. Before compiling, set the WiFi network, Ollama URL, model name and text query. Check that the display, button and indicator pins match your assembly.

The firmware makes the HTTP request in `networkTask`, a FreeRTOS task. The main loop handles interaction and updates the display. This separation organizes the work, but it does not guarantee a response time or eliminate network errors.

## Test device states

| Test | What to observe |
|---|---|
| Server and model available | Query sent and response displayed. |
| Incorrect model name | HTTP status or error message. |
| Server switched off | Handling of a failed connection or timeout. |
| WiFi disconnected | Disconnection indication. |
| Longer query | Available memory, duration and response presentation. |

Record the firmware version, model and result of each test. If the API works from a computer but not from the device, check connectivity, configuration and serial monitor output before changing the model.
