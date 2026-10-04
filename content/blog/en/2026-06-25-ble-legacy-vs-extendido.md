---
title: "BLE on PAD: advertising modes and diagnostics"
date: "2026-06-25"
lang: "en"
summary: "How to select legacy, extended or dual advertising in PAD firmware and distinguish discovery, connection and reset problems."
tags: ["esp32", "ble", "firmware"]
category: "devlog"
---

When PAD does not appear in a Bluetooth scan, distinguish three situations: the computer cannot discover it, it discovers it but cannot connect, or the device resets during connection.

The firmware includes serial controls for comparing these states without rebuilding. The implementation is in `projects/pad/src/transport/BleHidTransport.cpp`.

## Available modes

| Serial command | Action |
|---|---|
| `l` | Select legacy advertising. |
| `e` | Select extended advertising. |
| `d` | Select dual mode. |
| `s` | Show the current state. |
| `c` | Clear saved bonds and restart advertising. |

The code defaults to dual mode. These modes let you test compatibility with different adapters and operating systems; they do not guarantee that all of them support the same discovery or pairing methods.

## Check discovery and connection separately

1. Open the serial monitor and query the state with `s`.
2. Try an advertising mode and run a new scan from the computer.
3. If PAD appears, attempt a connection and watch the firmware messages.
4. Record the adapter, operating system, firmware version and selected mode.

Clearing bonds with `c` means you will need to pair the device again. Also check the bonds saved on the computer.

## Resets during pairing

The code explicitly initializes callbacks with `setCallbacks(nullptr)`. The implementation comment links this to a failure observed in `NimBLEExtAdvertising`.

Read that detail in the context of the NimBLE version used by the project. Do not assume that every connection failure has the same cause or that the behavior is unchanged across versions.

## What to record when reproducing a problem

Keep the serial log from the reset or error, the advertising mode and the dependency versions. On Linux, a `btmon` capture can provide information from the computer’s side.

Comparing these records helps locate the stage at which the connection fails and avoids treating a device reset as merely a scanning problem.
