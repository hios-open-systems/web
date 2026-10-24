# HIOS Node AI — cableado y BOM

> Generado por `scripts/gen-hardware-docs.ts` desde `config/hardware/`. No editar a mano: corré `npm run gen:hardware`.

MCU: **ESP32-S3-DevKitC-1 (N16R8)** · rev —

**Borrador.** Transcrito de `projects/hios-node-ai/PINOUT.md (firmware: src/main.cpp)`; el firmware no confirma todo el cableado. No soldar hasta resolver las advertencias.

Esquema: [`schematic.svg`](schematic.svg) · BOM: [`BOM.csv`](BOM.csv). Es cableado entre módulos (breakouts), no una PCB.

## Advertencias

- ⚠️ NO ARMABLE TODAVÍA: PINOUT.md y src/main.cpp ponen OLED SCL en GPIO22, que no existe en el ESP32-S3 (GPIO 0–21 y 26–48). Hay que elegir otro pin y actualizar ambos.
- ⚠️ src/main.cpp solo usa botón (4), LED (2) e I2C (21/22). El micrófono INMP441 y el MAX98357A están documentados pero el firmware todavía no los usa.
- ⚠️ No está documentado cómo se obtiene el riel 5V desde una sola 18650 + TP4056 (3.0–4.2V). Falta definir regulación/boost.

## Conexiones por módulo

### Energía

Alimentación: 18650 + TP4056 (USB-C) · el camino a 5V no está documentado

### Micrófono INMP441 (I2S)

Alimentación: VDD → 3V3 · GND → GND · L/R → GND (canal izquierdo)

| GPIO | Señal | Hacia | Nota |
|---|---|---|---|
| 42 | I2S Mic SCK | → SCK/BCLK del INMP441 |  |
| 41 | I2S Mic WS | → WS/LRC del INMP441 |  |
| 40 | I2S Mic SD | ← SD/DOUT del INMP441 |  |

### MAX98357A (I2S)

Alimentación: VIN → 5V · GND → GND · GAIN → GND

Carga: Parlante 4Ω 3W

| GPIO | Señal | Hacia | Nota |
|---|---|---|---|
| 15 | I2S Amp BCLK | → BCLK del MAX98357A |  |
| 16 | I2S Amp LRC | → LRC del MAX98357A |  |
| 17 | I2S Amp DIN | → DIN del MAX98357A |  |

### OLED SSD1306 0.96" (I2C 0x3C)

Alimentación: VCC → 3V3 · GND → GND

| GPIO | Señal | Hacia | Nota |
|---|---|---|---|
| 21 | I2C SDA | → SDA del OLED |  |
| 22 | I2C SCL | → SCL del OLED | GPIO22 no existe en el ESP32-S3 |

### Botón PTT + LED de estado

Alimentación: botón a GND · LED vía 330Ω a GND

| GPIO | Señal | Hacia | Nota |
|---|---|---|---|
| 4 | Botón PTT | → pulsador → GND (INPUT_PULLUP) |  |
| 2 | LED estado | → 330Ω → LED → GND |  |

## Rieles

| Riel | Conecta |
|---|---|
| 5V | MAX98357A VIN · 220µF cerca del ampli |
| 3V3 | INMP441 VDD · OLED VCC |
| GND común | todos los módulos |

## BOM

| Cant. | Componente | Función | Notas | Fuente |
|---|---|---|---|---|
| 1 | ESP32-S3-DevKitC-1 (N16R8) | MCU |  | `projects/hios-node-ai/COMPONENTS.md` |
| 1 | INMP441 | Micrófono MEMS I2S | firmware aún no lo usa | `projects/hios-node-ai/COMPONENTS.md` |
| 1 | MAX98357A | Amplificador I2S mono | firmware aún no lo usa | `projects/hios-node-ai/COMPONENTS.md` |
| 1 | OLED 0.96" SSD1306 (I2C 0x3C) | Pantalla de estado |  | `projects/hios-node-ai/COMPONENTS.md` |
| 1 | Pulsador 6×6 | Botón PTT |  | `projects/hios-node-ai/COMPONENTS.md` |
| 1 | LED 3mm difuso | Indicador de estado |  | `projects/hios-node-ai/COMPONENTS.md` |
| 1 | Resistencia 330Ω | Serie del LED |  | `projects/hios-node-ai/COMPONENTS.md` |
| 1 | Parlante 4Ω 3W (40mm) | Salida acústica |  | `projects/hios-node-ai/COMPONENTS.md` |
| 1 | Cargador TP4056 USB-C | Carga de batería |  | `projects/hios-node-ai/COMPONENTS.md` |
| 1 | Celda 18650 | Alimentación | falta definir cómo se obtiene 5V | `projects/hios-node-ai/COMPONENTS.md` |
| 1 | Capacitor 220µF | Desacople 5V cerca del MAX98357A |  | `projects/hios-node-ai/PINOUT.md` |

`¿?` = la cantidad no está documentada todavía.

## Checklist antes de energizar

- [ ] Resolver el pin de SCL (GPIO22 no existe en el S3) antes de soldar
- [ ] Definir y medir el riel 5V antes de conectar el MAX98357A
- [ ] Sin cortocircuito entre 5V y GND, y entre 3V3 y GND
