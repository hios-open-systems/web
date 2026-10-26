# HIOS Node AI — cableado y BOM

> Generado por `scripts/gen-hardware-docs.ts` desde `config/hardware/`. No editar a mano: corré `npm run gen:hardware`.

MCU: **ESP32-S3-DevKitC-1 (N16R8)** · rev 1.0

Pines verificados contra el firmware (`projects/hios-node-ai/src/main.cpp`) en cada `npm test`.

Esquema: [`schematic.svg`](schematic.svg) · BOM: [`BOM.csv`](BOM.csv). Es cableado entre módulos (breakouts), no una PCB.

## Advertencias

- ⚠️ Diseño completo pero todavía no armado ni compilado: probalo módulo por módulo con la checklist antes de cerrar la caja.
- ⚠️ El micrófono queda cableado y reservado (GPIO40–42); el firmware aún no lo lee. Para voz hace falta además un servidor de transcripción en la PC: Ollama solo recibe texto.

## Camino de la energía

18650 (1S) → TP4056 + DW01A → SW1 → U3V40F5 5V → SS34 → DevKit 5V → LDO 3V3

## Conexiones por módulo

### Energía 1S → 5V

Alimentación: 18650 → TP4056 con protección → SW1 → Pololu U3V40F5 (5V) → SS34 → pin 5V del DevKit · 5V del boost → MAX98357A

### Medición de batería

Alimentación: divisor 100k/100k desde la salida del switch + 100nF a GND

| GPIO | Señal | Hacia | Nota |
|---|---|---|---|
| 1 | VBAT ADC | ← punto medio del divisor 100k/100k (4.2V → 2.1V) |  |

### Micrófono INMP441 (I2S)

Alimentación: VDD → 3V3 · GND → GND · L/R → GND (canal izquierdo)

| GPIO | Señal | Hacia | Nota |
|---|---|---|---|
| 42 | I2S Mic SCK | → SCK del INMP441 |  |
| 41 | I2S Mic WS | → WS del INMP441 |  |
| 40 | I2S Mic SD | ← SD del INMP441 |  |

### MAX98357A (I2S)

Alimentación: VIN → 5V del boost · GND → GND · GAIN → GND (12 dB) · SD → VIN

Carga: Parlante 4Ω 3W a OUT+ / OUT− (ningún borne a GND)

| GPIO | Señal | Hacia | Nota |
|---|---|---|---|
| 15 | I2S Amp BCLK | → BCLK del MAX98357A |  |
| 16 | I2S Amp LRC | → LRC del MAX98357A |  |
| 17 | I2S Amp DIN | → DIN del MAX98357A |  |

### OLED SSD1306 0.96" (I2C 0x3C)

Alimentación: VCC → 3V3 · GND → GND

| GPIO | Señal | Hacia | Nota |
|---|---|---|---|
| 8 | I2C SDA | → SDA del OLED |  |
| 9 | I2C SCL | → SCL del OLED |  |

### Botón PTT + LED de estado

Alimentación: botón a GND · LED vía 330Ω a GND

| GPIO | Señal | Hacia | Nota |
|---|---|---|---|
| 4 | Botón PTT | → pulsador → GND (INPUT_PULLUP) |  |
| 2 | LED estado | → 330Ω → ánodo del LED; cátodo → GND |  |

## Rieles

| Riel | Conecta |
|---|---|
| BAT (3.0–4.2V) | TP4056 OUT+ → SW1 → U3V40F5 VIN · divisor VBAT |
| 5V | U3V40F5 VOUT → MAX98357A VIN + 220µF · U3V40F5 VOUT → SS34 → DevKit 5V (J1 pin 21) |
| 3V3 | LDO del DevKit (J1 pin 1) → INMP441 VDD · OLED VCC |
| GND común | TP4056 OUT− · U3V40F5 GND · DevKit G · todos los módulos |

## Detalle por bloque

### Pines elegidos

I2C en GPIO8/9: son los pines por defecto de Wire para el ESP32-S3 en Arduino (variants/esp32s3/pins_arduino.h). GPIO22 no existe en el S3 y GPIO26–37 los ocupa la flash/PSRAM octal del N16R8. Se evitan los pines de arranque 0, 3, 45 y 46, el USB (19/20), el UART0 (43/44) y GPIO38 (LED RGB de la placa v1.1). GPIO1 es ADC1: sigue midiendo con el WiFi encendido.

### Energía: carga, corte y boost

Espressif documenta las fuentes del DevKit (USB, pin 5V, pin 3V3) como mutuamente excluyentes. El SS34 en serie hace que el boost y el USB no se peleen: con USB conectado, el diodo queda en inversa. El boost no corta la carga: si se deshabilita, la batería pasa directo a la salida (≤4.2V, seguro para el LDO y el ampli).

| Pin | Qué | Hacia | Nota |
|---|---|---|---|
| B+ / B− | TP4056 | ← 18650 (+ / −) en portapilas |  |
| OUT+ | TP4056 | → SW1 → VIN del U3V40F5 y arriba del divisor VBAT |  |
| OUT− | TP4056 | → GND común |  |
| EN | U3V40F5 | → 22kΩ → GND | R = 36.9 / (Vcorte − 1.38) kΩ: 22kΩ ≈ 3.06V |
| VOUT | U3V40F5 | → MAX98357A VIN y → ánodo SS34; cátodo → DevKit 5V |  |
| GND | U3V40F5 | → GND común |  |

### Audio: MAX98357A

GAIN a GND = 12 dB. SD a VIN deja el ampli encendido en canal izquierdo; el firmware manda el mismo sample en los dos slots, así suena con cualquier ajuste de SD. A 5V entrega hasta 3.2W en 4Ω: el parlante es de 3W, el firmware usa volumen moderado.

| Pin | Qué | Hacia | Nota |
|---|---|---|---|
| GAIN | Ganancia | → GND (12 dB) |  |
| SD | Encendido / canal | → VIN |  |
| 220µF | Reserva | entre VIN y GND, pegado al módulo |  |

## BOM

| Cant. | Componente | Función | Notas | Fuente |
|---|---|---|---|---|
| 1 | ESP32-S3-DevKitC-1 (N16R8) | MCU | 16MB flash + 8MB PSRAM octal | `projects/hios-node-ai/COMPONENTS.md` |
| 1 | INMP441 breakout | Micrófono MEMS I2S | VDD a 3V3; firmware aún no lo lee | `projects/hios-node-ai/COMPONENTS.md` |
| 1 | MAX98357A breakout | Amplificador I2S mono | 2.5–5.5V; 3.2W en 4Ω a 5V | `projects/hios-node-ai/COMPONENTS.md` |
| 1 | OLED 0.96" SSD1306 I2C (0x3C) | Pantalla de estado |  | `projects/hios-node-ai/COMPONENTS.md` |
| 1 | Pulsador 6×6 | Botón PTT |  | `projects/hios-node-ai/COMPONENTS.md` |
| 1 | LED 3mm difuso | Indicador de estado |  | `projects/hios-node-ai/COMPONENTS.md` |
| 1 | Resistencia 330Ω | Serie del LED |  | `projects/hios-node-ai/COMPONENTS.md` |
| 1 | Parlante 4Ω 3W (40mm) | Salida acústica |  | `projects/hios-node-ai/COMPONENTS.md` |
| 1 | Cargador TP4056 USB-C con protección (DW01A + FS8205A) | Carga 4.2V y protección de la celda | usar la versión con OUT+/OUT−; corte por descarga 2.4V, sobrecorriente ~3A | `projects/hios-node-ai/COMPONENTS.md` |
| 1 | Celda 18650 + portapilas 1S | Alimentación |  | `projects/hios-node-ai/COMPONENTS.md` |
| 1 | Pololu U3V40F5 (step-up 5V) | Riel 5V desde la celda | arranca con ≥2.7V; hasta 4A de entrada; pololu.com/product/4012 | `projects/hios-node-ai/COMPONENTS.md` |
| 1 | Resistencia 22kΩ | EN del U3V40F5 → GND | corte por baja tensión ≈3.06V | `projects/hios-node-ai/COMPONENTS.md` |
| 1 | Diodo Schottky SS34 (3A, 40V) | Boost → pin 5V del DevKit | evita conflicto con el USB | `projects/hios-node-ai/COMPONENTS.md` |
| 1 | Interruptor deslizante SW1 | Encendido (salida del TP4056) | que soporte ≥3A | `projects/hios-node-ai/COMPONENTS.md` |
| 2 | Resistencia 100kΩ | Divisor VBAT → GPIO1 | 4.2V → 2.1V | `projects/hios-node-ai/COMPONENTS.md` |
| 1 | Capacitor 100nF | Filtro del ADC en GPIO1 |  | `projects/hios-node-ai/COMPONENTS.md` |
| 1 | Capacitor 220µF | Reserva en VIN del MAX98357A |  | `projects/hios-node-ai/PINOUT.md` |

`¿?` = la cantidad no está documentada todavía.

## Checklist antes de energizar

- [ ] Celda en B+/B− del TP4056 con la polaridad medida; nada conectado a OUT todavía
- [ ] U3V40F5 solo, con SW1 encendido: 5.0V ±4% en VOUT antes de conectar cargas
- [ ] R de 22kΩ entre EN y GND del U3V40F5 (corte ~3.06V)
- [ ] SS34 con el cátodo (raya) hacia el pin 5V del DevKit
- [ ] Sin cortocircuito entre 5V, 3V3, BAT y GND
- [ ] OLED en SDA=8 / SCL=9 y 3V3; aparece en 0x3C con un escáner I2C
- [ ] MAX98357A: VIN al 5V del boost, SD a VIN, GAIN a GND, parlante solo entre OUT+ y OUT−
- [ ] INMP441: L/R a GND, VDD a 3V3 (nunca a 5V)
- [ ] Tensión en GPIO1 ≈ mitad de la batería (≤2.1V)
- [ ] Para flashear por USB podés dejar SW1 encendido: el SS34 evita que el USB alimente el boost
