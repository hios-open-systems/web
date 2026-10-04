---
title: "Remote services and local control: choosing dependencies"
date: "2026-09-20"
lang: "en"
summary: "What to review when connecting a device to external services and how to decide which functions must remain available without that connection."
tags: ["ai", "opinion", "open-source", "democratization"]
category: "referencia"
---

A connected device may depend on several systems: its firmware, the local network, a server and an external API. Each dependency adds capabilities as well as conditions for use, maintenance and availability.

Design starts with a concrete question: what should the device be able to do when one of those parts stops responding?

## Separate functions and their requirements

A language model query may require a server. Reading a button or performing a local action may have different requirements. Define those differences before connecting everything in a single flow.

| Aspect | Remote service | Service on the local network |
|---|---|---|
| Connectivity | Requires access to the service through the internet. | Requires access to the computer running it. |
| Operation | Depends on the provider and account configuration. | Requires maintaining the computer, software and network. |
| Data | Review what information is sent and how it is handled. | Review access, logs and external services used. |
| Changes | Track API versions, limits and terms. | Manage component versions and compatibility. |

“Local” does not automatically mean “offline”: a device querying a network server still depends on that server. The word alone does not determine the system’s latency, privacy or security either.

## Define failure behavior

For each network query, establish what should happen if no response arrives, the format is invalid or the service rejects the request. Show a state that distinguishes these cases.

When an operation takes time, the interface should communicate that. If the architecture lets you separate the query from physical interaction, still check how those parts coordinate and which resources they share.

A generated response should not become a hardware command directly. Validate its format, allowed values and authorization to perform the action. The application’s logic decides what the device is permitted to do.

## What available source code provides

Access to firmware and documentation lets you inspect dependencies, adapt behavior and reproduce tests. You also need build instructions, identified versions and a license that permits your intended use.

That availability supports review, but it does not replace testing or guarantee that every function is complete. Check each project’s status and limitations.

## An example in HIOS

The Node AI prototype queries Ollama from an ESP32-S3 and shows the response on an OLED display. The model runs on another computer: the microcontroller must connect to that server to obtain a response.

This separation lets you study integration between a device and a local model without presenting inference as a function already running inside the ESP32. The audio and TinyML functions mentioned in the design material remain pending work.

## Before choosing an architecture

- List the functions that require a network and those that must work without it.
- Define timeouts and understandable error states.
- Review which data leaves the device and where it goes.
- Document each service’s versions and requirements.
- Test disconnections and invalid responses as well as normal operation.
