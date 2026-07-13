# HIOS PAD — Pinout

**Rev:** 0.9
**MCU:** ESP32-S3 DevKitC-1 — **N16R8** (16 MB flash + 8 MB PSRAM octal, AP Memory 3.3 V, confirmado por chip dump)
**Fuente de verdad:** [`src/app/Pins.h`](src/app/Pins.h) + [`platformio.ini`](platformio.ini) · espejo humano en [`pinout.data.js`](pinout.data.js)

> ⚠️ Todos los números son **GPIO** (lo que dice la serigrafía: `IO15`, `IO40`…), **no** la posición física del pin en el header. Emparejá siempre por el `IOxx` impreso en la placa.

> ⚠️ Este doc describe el **cableado objetivo** (rev 0.9, para soldar en la carcasa nueva). El firmware de hoy todavía lee 5 botones directos y no tiene driver de matriz ni de I2S. El refactor de firmware es una pasada aparte.

---

## 1. Layout físico

De arriba hacia abajo:

```
        ┌─────────────────────────────┐
        │       PANTALLA (3.5")       │   horizontal
        └─────────────────────────────┘
   ALT1   ALT2   [encoder]   [stick]        ← fila NAVEGACIÓN (todos directos)
   ACC1  ACC2  ACC3  ACC4  ACC5             ← fila acción 1  ┐ matriz 2×5
   ACC6  ACC7  ACC8  ACC9  ACC10            ← fila acción 2  ┘ (con diodos)
```

---

## 2. Tabla de pinout

| GPIO | Función | Riel | Destino |
| :--- | :------ | :--- | :------ |
| 1 | Stick VRx | 3V3 | Stick eje X (ADC1) — nav |
| 2 | Stick VRy | 3V3 | Stick eje Y (ADC1) — nav |
| 4 | Encoder CLK | 3V3 | KY-040 canal A — nav |
| 5 | Encoder DT | 3V3 | KY-040 canal B — nav |
| 6 | Encoder SW | 3V3 | KY-040 pulsador (PULLUP) — nav |
| 7 | Stick SW | 3V3 | Stick pulsador (PULLUP) — nav |
| 8 | Matriz COL 1 | — | INPUT_PULLUP · lee ACC2 / ACC7 |
| 9 | NeoPixel DIN | 5V | Datos de la tira (vía 330Ω). Ex-divisor de batería |
| 10 | TFT CS | 5V | ILI9488 chip-select |
| 11 | TFT MOSI | 5V | ILI9488 SDI |
| 12 | TFT SCLK | 5V | ILI9488 SCK |
| 13 | TFT DC | 5V | ILI9488 DC/RS |
| 14 | TFT RST | 5V | ILI9488 reset |
| 15 | Matriz FILA 0 | — | OUTPUT (drive LOW) · fila de ARRIBA: ACC1–5 |
| 16 | Matriz FILA 1 | — | OUTPUT (drive LOW) · fila de ABAJO: ACC6–10 |
| 17 | Botón ALT1 | — | → GND (INPUT_PULLUP) · DIRECTO, sin diodo |
| 18 | Matriz COL 0 | — | INPUT_PULLUP · lee ACC1 / ACC6 |
| 19 | USB D− | — | USB nativo (HID) — **RESERVADO** |
| 20 | USB D+ | — | USB nativo (HID) — **RESERVADO** |
| 21 | TFT backlight | — | LED de la TFT (PWM por LEDC) |
| 38 | Matriz COL 2 | — | INPUT_PULLUP · lee ACC3 / ACC8 |
| 39 | Matriz COL 3 | — | INPUT_PULLUP · lee ACC4 / ACC9 |
| 40 | I2S BCLK | — | → BCLK de **ambos** MAX98357A (bus compartido) |
| 41 | I2S LRC / WS | — | → LRC de **ambos** MAX98357A (word-select L/R) |
| 42 | I2S DIN | — | → DIN de **ambos** MAX98357A (dato serial) |
| 43 | UART0 TX | — | Serial + flasheo por cable (CH343) |
| 44 | UART0 RX | — | Serial + flasheo por cable (CH343) |
| 47 | Matriz COL 4 | — | INPUT_PULLUP · lee ACC5 / ACC10 |
| 48 | Botón ALT2 | — | → GND (INPUT_PULLUP) · DIRECTO, sin diodo |

---

## 3. Rieles de alimentación

| Riel | Origen | Va a |
| :--- | :----- | :--- |
| **5V** | Buck 5.0V (≥2–3A) | ESP32 pin 5V · TFT VCC (vía SW-PANTALLA) · NeoPixel VCC · 2× MAX98357A Vin · cap 470–1000µF |
| **3V3** | Regulador del S3 (AMS1117) | Stick VCC · Encoder + — **NO inyectar de afuera** |
| **GND** | — | Masa común: batería−, buck, S3, TFT, stick, encoder, matriz, ALT, amplis, NeoPixel |

```
Cargador 2S ──┬── 2 celdas (6.0–8.4V)
              └─[SW-CELDAS]─► Buck 5.0V (≥2–3A) ─► RIEL 5V
   RIEL 5V ─► ESP32 pin 5V ─►(AMS1117)─► pin 3V3 ─► RIEL 3V3
   RIEL 5V ─► cap 470–1000µF ─► GND   (+1000µF cerca de los amplis)
   RIEL 5V ─[SW-PANTALLA]─► Pantalla VCC
```

**USB no alimenta nada** (el pad es wireless). Con parlantes el pico de corriente sube: buck **≥2–3A** + cap de bulk generoso, o vuelve el brownout.

---

## 4. Matriz de acción (2×5, con diodos)

```
              COL0(18) COL1(8) COL2(38) COL3(39) COL4(47)  ← INPUT_PULLUP (leer)
 FILA0 (15) ►  ACC1     ACC2     ACC3     ACC4     ACC5     ← fila de ARRIBA
 FILA1 (16) ►  ACC6     ACC7     ACC8     ACC9     ACC10    ← fila de ABAJO
   ▲ filas: OUTPUT, drive LOW de a una

 Celda (por tecla):   COL ──┤ botón ├──▷|── FILA
                                      1N4148 (RAYA/cátodo → FILA)
```

- **10 diodos de silicio**, uno por botón de acción. **1N4148** (o cualquier silicio: 1N400x / 1N540x sirven). **LEDs no** — su Vf deja la línea sobre el umbral de LOW.
- Cátodo (la raya) **hacia la FILA** → mata el *ghosting*. Si no registra, dalos vuelta.
- Los **ALT no llevan diodo**: son directos, igual que el SW del encoder y el del stick.

---

## 5. Parlantes — 2× MAX98357A (I2S)

Los dos amplis cuelgan de las **mismas 3 líneas** (BCLK/LRC/DIN): I2S es un bus. Lo que define L/R **no** es un cable distinto, es el pin **SD** de cada módulo.

| Tensión en SD (medida a GND) | Salida |
| :--- | :--- |
| < 0,16 V | apagado |
| 0,16 – 0,77 V | (L+R)/2 |
| 0,77 – 1,4 V | **Right** |
| > 1,4 V | **Left** |

- Ampli **L**: `SD → Vin` directo (medí > 1,4 V).
- Ampli **R**: `SD → 220–330 kΩ → Vin` (medí 0,77–1,4 V).
- **Ganancia** por el pin GAIN: flotante = 9 dB · a GND = 12 dB · a Vin = 6 dB.
- Parlante 4–8 Ω **directo** a la salida (Class-D filterless: sin resistencia ni filtro). Ninguna salida va a GND.

---

## 6. Presupuesto de pines

Matriz de acción 7 (2 filas + 5 columnas) + 2 ALT directos + 3 I2S = **12 GPIO**. Queda **GPIO3** de reserva (es strapping).

**GPIO no usables en el N16R8:**

| Rango | Motivo |
| :--- | :--- |
| 26–32 | Flash SPI en-package |
| 33–37 | **PSRAM octal** (el sufijo R8 se los come) |
| 19 / 20 | USB nativo |
| 43 / 44 | UART0 (serial + flasheo) |
| 0 / 3 / 45 / 46 | Strapping |

> El datasheet genérico del ESP32-S3 lista los 26–37 como GPIO. En **este** módulo no lo son: la flash y la PSRAM octal los ocupan. `platformio.ini` lo declara con `board_build.arduino.memory_type = qio_opi`; si ese flag estuviera mal, el pad no arrancaría.

---

## 7. Checklist de armado

- [ ] Buck medido a 5.0 V **antes** de conectar el S3 (≥2–3 A si van parlantes)
- [ ] Masa común con continuidad (batería−, buck, S3, TFT, stick, encoder, matriz, ALT, amplis, NeoPixel)
- [ ] Cap bulk 470–1000 µF en el riel 5V + 1000 µF cerca de los amplis (polaridad OK)
- [ ] Stick y encoder al riel **3V3** (NO 5V) — verificado con multímetro
- [ ] Matriz: 2 filas (15/16 = OUTPUT) + 5 columnas (18/8/38/39/47 = INPUT_PULLUP)
- [ ] 10 diodos, cátodo (raya) hacia la FILA → evita ghosting
- [ ] ALT1→GPIO17 y ALT2→GPIO48 **directos** a GND (INPUT_PULLUP), **sin** diodo
- [ ] NeoPixel: 330 Ω en serie en DIN (GPIO9) + level-shifter/SK6812 + cap en su 5V
- [ ] I2S: BCLK=40, LRC=41, DIN=42 cableados a **ambos** amplis (bus compartido)
- [ ] Ampli-L: SD→Vin, medí SD > 1,4 V · Ampli-R: SD→220–330 kΩ a Vin, medí 0,77–1,4 V
- [ ] GAIN de cada ampli seteado (flotante = 9 dB) · parlante 4–8 Ω directo
- [ ] SW-CELDAS corta VBAT · SW-PANTALLA corta VCC de la TFT
- [ ] Primer flasheo **por cable**; después OTA (`--upload-port hiospad.local`)
- [ ] BOOT (GPIO0) + USB-C nativo accesibles para recuperación ante OTA fallido

---

_Guía interactiva: [openhios.dev/es/pinouts/pad](https://openhios.dev/es/pinouts/pad)_
