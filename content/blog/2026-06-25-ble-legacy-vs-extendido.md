---
title: "BLE que no aparecía: legacy vs extendido"
date: "2026-06-25"
lang: "es"
summary: "Por qué el macropad se veía en Windows pero no en Linux, y cómo el advertising extendido de BLE 5 — más un bug de NimBLE — lo explicaba."
tags: ["esp32", "ble", "firmware"]
category: "devlog"
---

El HIOS PAD funcionaba por Bluetooth en Windows, pero en Linux ni siquiera aparecía en el escaneo. Mismo hardware, mismo firmware: el clásico "anda en una máquina y en la otra no".

## La pista

El adaptador de Linux no estaba tomando el **advertising legacy** de BLE. Para que apareciera había que emitir **advertising extendido**, la variante de BLE 5. El detalle es que el stack de Bluetooth de **Windows no escanea advertising extendido** para emparejar. Cada modo dejaba afuera a una de las dos plataformas.

## El bug escondido

Encima había un bug conocido de NimBLE-Arduino: el constructor de `NimBLEExtAdvertising` no inicializaba su puntero de callbacks. Al entrar una conexión el advertising terminaba, se disparaba el evento de "adv complete" y se dereferenciaba un puntero basura → `panic LoadProhibited`. El ESP se reiniciaba en cada conexión y, desde afuera, parecía un simple "no conecta".

## La solución

1. **Advertising dual.** Emitir una instancia *legacy* (para Windows) y una *extendida* (para el adaptador de Linux) a la vez. Así empareja en ambos sin tocar nada.
2. **Matar el crash.** `setCallbacks(nullptr)` apunta el puntero a un callback por defecto (no-op) y elimina el panic.

El modo quedó además conmutable en runtime por serial (`l` / `e` / `d`), para probar en distintas máquinas sin reflashear.

## Moraleja

"No conecta" eran tres problemas apilados: discovery (legacy vs extendido), un crash que se disfrazaba de timeout, y bonding viejo del lado del host. Separarlos — con `btmon` de un lado y el log serial del otro — fue lo que destrabó todo.
