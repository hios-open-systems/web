---
title: "Feedback real sin romper lo local-first"
date: "2026-06-24"
lang: "es"
summary: "Cómo un daemon liviano le da al macropad el estado real de la PC (volumen, mic, temperaturas) sin que el device dependa de él para funcionar."
tags: ["companion", "arquitectura", "local-first"]
category: "devlog"
---

El macropad muestra cosas en su pantalla: volumen, si el micrófono está muteado, temperaturas. El problema es que el device, por sí solo, no *sabe* el estado real de la PC — solo conoce lo que él mismo mandó (estado "optimista").

## El daemon companion

Un proceso liviano (Node, headless) corre en la PC, lee el estado real — volumen del sistema, mic, temperaturas de CPU/GPU — y lo empuja al pad con `POST /api/state` cada segundo. La pantalla pasa de mostrar lo que *cree* a mostrar lo que *es*.

## La regla de oro: local-first

La parte importante del diseño es lo que pasa **cuando el daemon no está**:

- El pad funciona perfecto sin él. Sigue siendo HID nativo (teclado/mouse/multimedia) por USB y BLE.
- Si el daemon se cae, el pad vuelve al estado optimista en unos segundos. No se cuelga, no espera, no rompe.

El WiFi y el companion son una capa **opcional que mejora**, nunca un requisito.

## Comandos de vuelta

El canal no es de una sola dirección. El pad puede pedirle algo al companion — por ejemplo, un **mute global de micrófono** a nivel sistema operativo — y ese comando viaja en la *respuesta* del POST. El daemon lo ejecuta (Core Audio en Windows, PipeWire/PulseAudio en Linux) y reporta el nuevo estado en el siguiente push. Funciona en cualquier app, no depende del atajo de Slack o Meet.

## Por qué importa

Es la diferencia entre un gadget que necesita su software para servir, y uno que sirve solo y se *enriquece* con software. Lo segundo envejece mucho mejor.
