# HIOS WiFi Speaker

Parlante WiFi + Bluetooth con ESP32: **2× amplificador I2S MAX98357 en estéreo**, display LCD 16×2 y batería 2S recargable por USB-C. Reproduce radios WiFi, audio de YouTube (vía Invidious) y actúa como sink Bluetooth A2DP, con control por interfaz web.

## Quick Start

```bash
cd projects/speaker
pio run -t upload             # compilar y flashear (PlatformIO)
pio device monitor -b 115200  # monitor serial
```

Ya en la red: **http://hios-speaker.local**.

## ¿Qué es?

Un hub de audio de escritorio. Modos (enum `Mode` en `src/main.ino`):

- **WiFi Radio** — streams de radio (presets + URL custom).
- **YouTube** — audio de YouTube vía la API de Invidious.
- **Bluetooth A2DP** — sink: le mandás audio desde el celu/PC.
- **Config por BT serial** — seteás el WiFi desde una terminal Bluetooth, sin recompilar.

Todo sale por I2S a los dos MAX98357 (estéreo real, un ampli por canal). El LCD muestra modo, volumen y título.

## Cableado

La hoja verificada contra el firmware es la guía **[/pinouts/speaker](https://openhios.dev/pinouts/speaker)** (se auto-verifica contra `src/main.ino` en cada `npm run test:wiring`). Resumen:

| Bus | ESP32 | A |
|---|---|---|
| I2S DIN | GPIO25 | DIN de **ambos** MAX98357 (bus compartido) |
| I2S BCLK | GPIO26 | BCLK de ambos |
| I2S LRC | GPIO27 | LRC de ambos |
| I2C SDA / SCL | GPIO21 / GPIO22 | LCD 16×2 (0x27) |
| VBAT | GPIO34 | divisor 100k/100k del pack (IO34 es input-only) |
| 5V / GND | VIN / GND | del LM2596 (buck a 5.0V) |

> **El canal L/R lo elige el pin SD de cada ampli — MEDÍ, no asumas.** El bus I2S es compartido; lo único distinto entre los dos módulos es SD. Left = SD→Vin (medí >1,4V); Right = SD→Vin por ~220–330k (medí 0,77–1,4V). Ver el paso "medir SD" en la guía. El viejo dato "1MΩ→GND=Left" es datasheet-dudoso: **no lo uses.**

## Componentes (BOM)

Estéreo, pack 2S:

| Componente | Función | Specs clave | ~USD |
|---|---|---|---|
| ESP32 DevKit (WROOM-32) | Micro + WiFi + BT | solo 2.4GHz | $8 |
| **2×** MAX98357 | Ampli I2S (L + R) | 3.2W @4Ω, clase D, 2.5–5.5V, THD+N 0.015% | $6 |
| **2×** parlante 63mm | Salida (L + R) | 4Ω, 3W, 87dB, F0 ~135Hz | $6 |
| LCD 16×2 + backpack I2C | Display de estado | HD44780, 0x27 (a veces 0x3F), 5V | $4 |
| LM2596S c/display | Buck 5.0V | 1.25–37V ajust., ~3A c/disipador, ~95% | $4 |
| Cargador 2S USB-C | BMS + carga | 8.4V full, 2.2A carga, requiere 5V/4A | $5 |
| **2×** 18650 (serie/2S) | Batería | 7.4V nom → 8.4V full | $12 |
| Resistencias | 2× 100k (divisor VBAT) · 1 R para SD (valor **medido**) | | — |

> ⚠️ **Batería en SERIE (2S), no en paralelo.** El pack es 7.4V nominal (8.4V a plena carga) y el cargador USB-C es 2S. Un portapilas en paralelo (3.7V) es de una versión vieja y **no sirve** acá.

Compra (AR/MercadoLibre): "esp32 devkit v1" · "max98357 i2s amplificador" (×2) · "lcd 16x2 i2c" · "fuente lm2596 step down display" · "cargador litio 2s usb-c" · "porta pila 18650 serie" · "parlante 4 ohm 3w 63mm" (×2).

## Armado (el orden importa)

Cada fase se prueba antes de pasar a la siguiente:

1. **Energía primero.** Cargá el pack 2S, conectá al LM2596 y **ajustá el buck a 5.0V con el multímetro. NO conectes nada más hasta tener 5V estables.**
2. **ESP32** — OUT+ del buck → VIN, OUT− → GND. Probá un Blink por USB.
3. **Amplis (×2)** — Vin→5V, GND→masa común, bus I2S (25/26/27) a los dos. Parlante 4–8Ω directo a la salida de cada ampli (class-D filterless, sin filtro).
4. **LCD** — VCC→5V, GND, SDA=21 / SCL=22.
5. **Firmware** — `tests/test_basic.ino` (debe dar un tono) → después `src/main.ino`.

## Banco de pruebas previo (antes del target real)

Para validar hardware/cableado/estabilidad antes del montaje final, usar:

- `testbench/README.md`
- `testbench/PINOUT.md`
- `testbench/VALIDATION_PLAN.md`
- `testbench/CHECKLIST_PRE_MONTAJE.md`
- `testbench/firmware/` (smoke, L/R, estéreo estabilidad)
- `testbench/results/logs/LOG_TEMPLATE.md`

**Soldadura:** 350–380°C con plomo (380–400 sin), contacto 2–3s, estañá puntas y pads primero. **Antes de encender:** continuidad de GND (0Ω entre todas las masas), sin corto VIN↔GND (∞), buck a 5.0V. Fotos de referencia en `pics/build/` y `pics/modules/`.

## Troubleshooting (aprendido a los golpes)

- **Se reinicia al usar WiFi:** los picos de TX piden ~500mA → **cap 470µF en la entrada del ESP32** (y ojo con cable USB fino / fuente floja = brownout).
- **Zumbido / ruido:** **una sola masa** (no cablees el GND del ESP32 y del ampli por separado = ground loop); **100nF cerámico + 100µF electrolítico** cerca de cada MAX98357; alejá el ampli de la antena; ferrita en los cables de audio; I2S corto (<10cm) y trenzado.
- **Distorsión:** buck a 5V estables; bajá el volumen (el MAX98357 satura con señal muy fuerte).
- **Sale un solo canal:** SD mal seteado en un ampli → **medí SD**, no asumas la R.
- **WiFi no conecta:** el ESP32 es **solo 2.4GHz**. El voltaje del display del LM2596 es la **salida (5V)**, no la batería.

Consumo típico: idle ~80mA · reproduciendo ~150mA · volumen máx ~300mA. La autonomía depende de la capacidad de las celdas.

## Estado

En desarrollo — prototipo funcional. Firmware andando: WiFi radio, YouTube/Invidious, BT A2DP, config por BT serial, LCD y lectura de VBAT. Pendiente: PCB custom.

## Licencia

Open Hardware — usá, modificá y compartí libremente.

---

_HIOS — HI Open Systems · [openhios.dev/projects/speaker](https://openhios.dev/projects/speaker)_
