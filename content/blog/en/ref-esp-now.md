---
title: "ESP-NOW: communication between ESP32 devices without a router"
date: "2026-07-23"
lang: "en"
summary: "Configure peers, channels, messages and encryption, and distinguish radio reception from application processing."
tags: ["esp32", "esp-now", "wireless", "reference"]
category: "referencia"
---

ESP-NOW is an Espressif protocol that exchanges vendor-specific 802.11 action frames without establishing an IP connection. Compatible devices communicate by MAC address, using unicast or broadcast, without requiring a router. Measure latency and message delivery under your setup’s conditions.

## When it fits, and when it does not

| Scenario | Alternative to evaluate |
|---|---|
| Short messages between nearby boards | ESP-NOW |
| Internet access / MQTT / HTTP | WiFi (STA) |
| Communication with a phone | BLE |
| Network of nodes with routing | ESP-WIFI-MESH or Thread, depending on hardware |

ESP-NOW can be useful for short messages from sensors, remote controls or button panels. Confirm that all devices support the protocol. It does not replace an IP connection or directly communicate with any arbitrary phone or web service.

## Unicast, broadcast and peers

- **Unicast:** send to a registered peer’s MAC address. There is a MAC-level acknowledgement (802.11 ACK), and the send callback reports delivery status. This does not confirm that the application processed the message.
- **Broadcast:** send to `FF:FF:FF:FF:FF:FF`. It provides neither ESP-NOW encryption nor individual reception acknowledgements. Register the broadcast address before sending as well.
- Before sending unicast, **register the peer** with `esp_now_add_peer`, specifying its MAC, channel and interface. ESP-IDF documentation for ESP32 specifies up to **20 peers**, with a separate configurable limit for encrypted peers. Check both devices’ versions and configuration.

## Communication channel

All nodes need to use the **same WiFi channel**. Check this when diagnosing a communication problem:

- If ESP32 is in STA mode without connecting to an access point, use the channel you set with `esp_wifi_set_channel`.
- If it also connects to an access point, **the access point determines the channel**, which can change. ESP-NOW peers need to follow it.

Coexistence with WiFi is possible because ESP-NOW shares the radio, but there is only one channel. Configure everything on the same channel, or let nodes that are not associated with the access point discover it, for example through scanning or a custom broadcast beacon.

## Payload

The classic maximum payload is **250 bytes per frame**. ESP-NOW v2, available in recent ESP-IDF versions, increases that limit to 1470 bytes. If you need interoperability with older firmware, keep to 250 bytes. Larger messages need application-managed fragmentation and reassembly with sequence numbers.

## Encryption

ESP-NOW encrypts unicast with **CCMP**, using two keys:

- **PMK** (Primary Master Key): global, configured with `esp_now_set_pmk`.
- **LMK** (Local Master Key): per peer, supplied in the peer structure with `encrypt = true`.

Broadcast does not support ESP-NOW encryption. For messages that require it, configure encrypted unicast or design protection at the application layer. Using unicast without configuring keys does not enable encryption.

## Prepare a compatible example

Use the ESP-NOW example matching your ESP-IDF or Arduino-ESP32 version. Callback signatures can change between versions; compare them with the installed headers.

Setup includes starting WiFi, initializing ESP-NOW, registering callbacks and adding peers before sending data. Check each operation’s result and record errors.

On reception, validate length and format before interpreting a message. If processing takes time, move it to a worker task so the callback can return promptly.

The [official ESP-NOW reference](https://docs.espressif.com/projects/esp-idf/en/stable/esp32/api-reference/network/esp_now.html) documents versions, message limits, encryption and callbacks. Verify the limits for both ends of the communication.

## Diagnostic checks

- **Fixed channel versus STA channel changes:** joining an access point changes the node’s channel to match it. Nodes left on another channel may stop communicating.
- **Blocking callbacks:** both send and receive callbacks run in the WiFi task’s context. Avoid `delay()`, long print operations and heavy processing. Copy the payload to a FreeRTOS queue and process it in another task.
- **Confusing ACK with application delivery:** `ESP_NOW_SEND_SUCCESS` means the peer’s radio acknowledged the frame, not that application logic consumed it.
- **Power saving:** check its effect on reception in your configuration and define acknowledgements or retries if the application requires them.
- **Data format:** define sizes, byte order and message version. Do not assume an in-memory structure has the same representation on every board.
