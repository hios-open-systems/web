# HIOS PAD — cableado y BOM

> Generado por `scripts/gen-hardware-docs.ts` desde `config/hardware/`. No editar a mano: corré `npm run gen:hardware`.

MCU: **ESP32-S3 DevKitC-1 (N16R8)** · rev 0.9

Pines verificados contra el firmware (`projects/pad/src/app/Pins.h + Config.h + platformio.ini`) en cada `npm test`.

Esquema: [`schematic.svg`](schematic.svg) · BOM: [`BOM.csv`](BOM.csv). Es cableado entre módulos (breakouts), no una PCB.

## Conexiones por módulo

### Energía — 3 rieles

Alimentación: celdas 2S → SW-CELDAS → buck 5.0V (≥3A) → riel 5V · S3 pin 5V → LDO a bordo → riel 3V3

### Pantalla ILI9488 4" (SPI)

Alimentación: VCC → 5V · GND → GND · LED → SW-PANTALLA → GPIO21

| GPIO | Señal | Hacia | Nota |
|---|---|---|---|
| 10 | TFT CS | ILI9488 CS (chip-select) |  |
| 11 | TFT MOSI | ILI9488 SDI |  |
| 12 | TFT SCLK | ILI9488 SCK |  |
| 13 | TFT DC | ILI9488 DC/RS |  |
| 14 | TFT RST | ILI9488 RESET |  |
| 21 | TFT backlight | LED de la TFT (PWM por LEDC) · acá va en serie el SW-PANTALLA |  |

### Matriz de acción 2×5 (10 teclas)

Alimentación: no se alimenta: cada tecla cierra COLUMNA → diodo → FILA

| GPIO | Señal | Hacia | Nota |
|---|---|---|---|
| 8 | Matriz COL 1 | INPUT_PULLUP · lee ACC2 / ACC7 | es ADC1_7, pero acá va como digital |
| 15 | Matriz FILA 0 | OUTPUT (drive LOW) · fila de ARRIBA: ACC1–5 |  |
| 16 | Matriz FILA 1 | OUTPUT (drive LOW) · fila de ABAJO: ACC6–10 |  |
| 18 | Matriz COL 0 | INPUT_PULLUP · lee ACC1 / ACC6 |  |
| 38 | Matriz COL 2 | INPUT_PULLUP · lee ACC3 / ACC8 | en DevKitC-1 v1.1 este pin maneja el LED RGB de la placa. No rompe nada (el DIN del LED es alta impedancia) pero el pixel va a parpadear con el escaneo |
| 39 | Matriz COL 3 | INPUT_PULLUP · lee ACC4 / ACC9 |  |
| 47 | Matriz COL 4 | INPUT_PULLUP · lee ACC5 / ACC10 |  |

### Botones ALT (navegación)

Alimentación: no se alimenta: pulsador directo a GND (INPUT_PULLUP)

| GPIO | Señal | Hacia | Nota |
|---|---|---|---|
| 17 | Botón ALT1 | → GND (INPUT_PULLUP) · DIRECTO, sin diodo |  |
| 48 | Botón ALT2 | → GND (INPUT_PULLUP) · DIRECTO, sin diodo | en DevKitC-1 v1.0 este pin maneja el LED RGB de la placa. El pulsador funciona igual; el LED simplemente no se usa |

### Encoder KY-040

Alimentación: + → 3V3 · GND → GND

| GPIO | Señal | Hacia | Nota |
|---|---|---|---|
| 4 | Encoder CLK | KY-040 canal A |  |
| 5 | Encoder DT | KY-040 canal B |  |
| 6 | Encoder SW | KY-040 pulsador (INPUT_PULLUP) |  |

### Stick analógico (HW-504)

Alimentación: +5V del módulo → riel 3V3 · GND → GND

| GPIO | Señal | Hacia | Nota |
|---|---|---|---|
| 1 | Stick VRx | Stick eje X — ADC1_0 |  |
| 2 | Stick VRy | Stick eje Y — ADC1_1 |  |
| 7 | Stick SW | Stick pulsador (INPUT_PULLUP) |  |

### 2× MAX98357A (I2S)

Alimentación: Vin → 5V · GND → GND · 1000µF cerca de los amplis

Carga: 2× parlante 4–8Ω

| GPIO | Señal | Hacia | Nota |
|---|---|---|---|
| 40 | I2S BCLK | → BCLK de AMBOS MAX98357A (bus compartido) |  |
| 41 | I2S LRC | → LRC de AMBOS MAX98357A (word-select L/R) |  |
| 42 | I2S DOUT | → DIN de AMBOS MAX98357A (dato serial). Sale del S3, entra al ampli: por eso acá es DOUT y allá DIN |  |

### 2× NeoPixel 4 LEDs (8 px)

Alimentación: VCC → 5V (o 1N400x en serie, ver tip) · GND → GND

| GPIO | Señal | Hacia | Nota |
|---|---|---|---|
| 9 | NeoPixel DIN | datos de la tira, vía 330Ω en serie | ex-divisor de batería. La medición de batería se descartó: NO reactivar BATTERY_ENABLED sin reasignar el ADC |

## Rieles

| Riel | Conecta |
|---|---|
| 5V (buck 5.0V) | ESP32 pin 5V · TFT VCC · NeoPixel VCC · 2× MAX98357A Vin · cap de bulk · buck ≥3A |
| 3V3 (LDO del DevKit) | Stick VCC · Encoder + . Lo genera el SGM2212-3.3 a bordo (800mA): NO inyectar de afuera |
| GND común | batería− · buck · S3 · TFT · stick · encoder · matriz · ALT · amplis · NeoPixel (1 sola masa) |

## Detalle por bloque

### ⚡ Energía — 3 rieles

USB no alimenta nada (uso wireless). El 3V3 sale del S3, no se inyecta. Presupuesto estimado a plena carga: 2 amplis a 4Ω (~1.5A) + 8 NeoPixel en blanco (~0.5A) + S3 con RF + backlight (~0.6A) ≈ 2.6A → el buck tiene que ser ≥3A, no 2A.

| Pin | Qué | Hacia | Nota |
|---|---|---|---|
| 5V | Buck OUT 5.0V | → RIEL 5V (S3, pantalla, NeoPixel, 2× ampli, cap) |  |
| 3V3 | S3 pin 3V3 | → RIEL 3V3 (stick + encoder) |  |
| GND | Masa común | todo junto (1 sola masa) |  |

### 🔌 Switches

SW-PANTALLA debe cortar la línea LED/BL, no el VCC de la pantalla. Si cortás VCC mientras los GPIO10–14 mantienen señales SPI de 3.3 V, se supera el límite de entrada del ILI9488 (VIN ≤ IOVCC + 0.3V, equivalente a 0.3 V con el módulo apagado). La corriente por los diodos de protección puede dañar el controlador. Mantené alimentado el módulo y controlá por separado la retroiluminación.

| Pin | Qué | Hacia | Nota |
|---|---|---|---|
| SW1 | SW-CELDAS | corta BAT+ → buck (apaga TODO) | ≥3A |
| SW2 | SW-PANTALLA | corta GPIO21 → LED/BL de la pantalla (la lógica queda alimentada) |  |

### 🖥️ Pantalla ILI9488 4"

SPI por HSPI a 27MHz. El MISO no se cablea (TFT_MISO=-1): solo escribimos. Los 5 pines de señal salen de platformio.ini, no de Pins.h — el backlight sí está en Pins.h porque lo maneja el LEDC a mano. ⚠️ El CS es 10: un doc viejo decía 13, y soldarlo ahí lo cortocircuita contra el DC.

| Pin | Qué | Hacia | Nota |
|---|---|---|---|
| 10 | CS | → CS (a veces serigrafiado "CD") |  |
| 11 | MOSI | → SDI del módulo |  |
| 12 | SCLK | → SCK / SCL del módulo |  |
| 13 | DC | → DC / RS |  |
| 14 | RST | → RESET |  |
| 21 | Backlight | → [SW-PANTALLA] → LED | el switch va acá, NUNCA cortando el VCC |
| VCC | Alimentación | → RIEL 5V | si el módulo trae buffer 74HC245 junto al header, VCC va a 3V3 o ves pantalla en blanco |
| GND | Masa | → GND común |  |
| — | MISO / SDO | NO se conecta (TFT_MISO=-1) |  |

### ⌨️ Matriz de acción 2×5

2 filas OUTPUT (en reposo HIGH, se bajan de a una) + 5 columnas INPUT_PULLUP. Un diodo por tecla, cátodo (la raya) hacia la FILA. Sin diodos, apretar 3 teclas en L inventa una cuarta (ghosting). Si una tecla no registra, el diodo está al revés: dalo vuelta. Sirve 1N4148 o cualquier silicio (1N400x/1N540x); LEDs no.

| Pin | Qué | Hacia | Nota |
|---|---|---|---|
| 15 | FILA 0 — arriba | OUTPUT · ACC1 a ACC5 |  |
| 16 | FILA 1 — abajo | OUTPUT · ACC6 a ACC10 |  |
| 18 | COL 0 | INPUT_PULLUP · ACC1 / ACC6 |  |
| 8 | COL 1 | INPUT_PULLUP · ACC2 / ACC7 | es ADC1_7, acá va como digital |
| 38 | COL 2 | INPUT_PULLUP · ACC3 / ACC8 | en DevKitC-1 v1.1 maneja el LED RGB de la placa: va a parpadear con el escaneo (cosmético) |
| 39 | COL 3 | INPUT_PULLUP · ACC4 / ACC9 |  |
| 47 | COL 4 | INPUT_PULLUP · ACC5 / ACC10 |  |

### 🔀 Botones ALT (navegación)

Van fuera de la matriz y sin diodo, a propósito: son los que abren capa/menú y tienen que leerse siempre, sin depender de qué fila está escaneando. Pulsador NA directo a GND, el pull-up es interno.

| Pin | Qué | Hacia | Nota |
|---|---|---|---|
| 17 | ALT 1 | pulsador → GND (INPUT_PULLUP) |  |
| 48 | ALT 2 | pulsador → GND (INPUT_PULLUP) | en DevKitC-1 v1.0 este pin maneja el LED RGB de la placa; el pulsador anda igual |

### 🎛️ Encoder KY-040

CLK y DT van por interrupción (cuadratura: el orden de flancos da el sentido). El SW es el pulsador del eje: press abre el menú. Si gira al revés, permutá CLK y DT. El módulo KY-040 ya trae sus pull-ups a bordo.

| Pin | Qué | Hacia | Nota |
|---|---|---|---|
| 4 | CLK — canal A | → CLK del módulo (interrupción) |  |
| 5 | DT — canal B | → DT del módulo (interrupción) |  |
| 6 | SW — pulsador | → SW (INPUT_PULLUP) |  |
| + | Alimentación | → RIEL 3V3 |  |
| GND | Masa | → GND común |  |

### 🕹️ Stick analógico HW-504

⚠️ El pin del módulo dice "+5V" pero va al riel 3V3. A 5V sobre-volta el ADC del S3 y los ejes se acoplan en el extremo alto (diagonales fantasma que vas a culpar al firmware). Los dos ejes van a GPIO1/GPIO2 = ADC1, el único ADC que sigue funcionando con WiFi/BLE encendido. El pulsador del stick es el click.

| Pin | Qué | Hacia | Nota |
|---|---|---|---|
| 1 | VRx — eje X | → VRx (ADC1_0) |  |
| 2 | VRy — eje Y | → VRy (ADC1_1) |  |
| 7 | SW — pulsador | → SW (INPUT_PULLUP) |  |
| +5V | Alimentación | → RIEL 3V3 (NO 5V) | el silk miente: verificá con multímetro antes de encender |
| GND | Masa | → GND común |  |

### 🔊 Bus I2S — a los DOS amplis

Las 3 líneas van en paralelo a los dos amplis: no hay un bus por canal. Lo único distinto entre ellos es el pin SD, que elige el canal (ver el bloque de abajo). Ojo con el nombre: sale del S3 como DOUT y entra al ampli como DIN — es el mismo cable.

| Pin | Qué | Hacia | Nota |
|---|---|---|---|
| 40 | BCLK — bit clock | → BCLK de AMBOS amplis |  |
| 41 | LRC — word select | → LRC de AMBOS amplis (elige L/R en el tiempo) |  |
| 42 | DOUT — dato serial | → DIN de AMBOS amplis |  |
| Vin | Alimentación | → RIEL 5V + 1000µF cerca de los amplis |  |
| GND | Masa | → GND común |  |

### 🔊 Canal de cada ampli (pin SD)

El pin SD del MAX98357A hace dos cosas: apaga el ampli y elige el canal, según la tensión que le pongas. Tiene un pulldown interno de 100k, así que la R que le colgás a Vin arma un divisor. Los umbrales son volts absolutos, no fracción de Vdd.

| Pin | Qué | Hacia | Nota |
|---|---|---|---|
| SD | Ampli IZQUIERDO | SD → Vin directo (5V) → banda >1.4V = Left |  |
| SD | Ampli DERECHO | SD → 360kΩ → Vin → ~1.09V = Right | Ejemplo a 5V, sin pullup en la placa. Si hay uno, usá el cálculo de SD: queda en paralelo. |
| GAIN | Ganancia | dejalo sin conectar = 9dB (ese es el que va flotante, NO el SD) |  |

### 🔈 Parlantes

No tienen GPIO — cuelgan de la salida de cada ampli, pero igual hay que soldarlos. El MAX98357A es class-D filterless: el parlante va directo a sus bornes, sin filtro ni cap de acople. ⚠️ No lo pruebes con una resistencia como carga falsa: la salida es un puente PWM sin filtrar y necesita la inductancia de la bobina — una carga resistiva la disipa como calor. Y ningún borne va a GND: la salida es diferencial (puenteada); masar uno mata el ampli.

| Pin | Qué | Hacia | Nota |
|---|---|---|---|
| + | Parlante IZQUIERDO | → borne + del ampli con SD → Vin |  |
| − | Parlante IZQUIERDO | → borne − del MISMO ampli (NO a GND común) |  |
| + | Parlante DERECHO | → borne + del ampli con SD → 360k |  |
| − | Parlante DERECHO | → borne − del MISMO ampli (NO a GND común) |  |

### 🌈 NeoPixel — 2 placas, 8 píxeles

Las 2 placas están encadenadas en un solo pin (DOUT de A → DIN de B) y eso no les quita independencia: cada WS2812B tiene su propio controlador y se come los primeros 24 bits que le llegan, así que los 8 píxeles se direccionan por separado (NEOPIXEL_COUNT=8). Efectos por zona = software, no cableado: pintás 0–3 con un color y 4–7 con otro. Un segundo GPIO de datos no compraría nada. En GPIO9 (ex-batería) → UART0 (43/44) queda libre p/ serial+flasheo, sin parpadeo de boot. Feedback por botón: encadená 1 LED por tecla en el MISMO GPIO9 (subí NEOPIXEL_COUNT) → RGB por tecla sin gastar pines.

| Pin | Qué | Hacia | Nota |
|---|---|---|---|
| 9 | DIN — placa A | GPIO9 → 330Ω en serie → DIN de la primera placa | 3.3V está bajo el umbral: 1N400x en serie con el VCC, o 74AHCT125 |
| — | DOUT A → DIN B | encadenado: la placa B sigue a la A (píxeles 4–7) | sentido único: DIN→DOUT. Al revés, la B queda muerta |
| 5V | VCC — las dos | → RIEL 5V vía 1N400x (→ ~4.35V) | ~60mA/LED a tope: 8 LEDs en blanco ≈ 0,5A. Limitá brillo |
| GND | GND — las dos | → GND común |  |

### 🔒 Sistema — USB / UART

Reservados: no les sueldes nada. GPIO19/20 son el USB nativo (el HID: si los tocás, el pad deja de gobernar la PC). GPIO43/44 son UART0 → CH343 → serial y flasheo por cable. El BOOT (GPIO0) y el USB-C tienen que quedar accesibles con la carcasa cerrada: es tu red si un OTA sale mal.

| Pin | Qué | Hacia | Nota |
|---|---|---|---|
| 19 | USB D− | USB nativo (HID) — RESERVADO |  |
| 20 | USB D+ | USB nativo (HID) — RESERVADO |  |
| 43 | UART0 TX | serial + flasheo (CH343) — RESERVADO |  |
| 44 | UART0 RX | serial + flasheo (CH343) — RESERVADO |  |
| 0 | BOOT | recuperación ante OTA fallido — dejalo accesible |  |

### 🔋 Batería — descartada en el pad

No se mide en el pad: la pantalla de la fuente ya muestra la tensión de entrada (= las 2 celdas 2S). GPIO9 (ex-divisor) ahora maneja el NeoPixel. En firmware: BATTERY_ENABLED=false — NO lo actives: BAT_ADC_PIN sigue apuntando al 9 y le meterías 2.7V DC a la línea de datos del NeoPixel.

### 🧮 Presupuesto de pines

Matriz acción 7 (2 filas + 5 cols) + 2 ALT directos + 3 I2S = 12 → usan todos los GPIO que quedaron. Sobra exactamente un pin: el GPIO3, y es strapping (JTAG_SEL), así que con cuidado. No usables: 26–32 (flash) y 33–37 (PSRAM octal del R8 — el DevKitC-1 ni siquiera saca 26–34 al header, y 35/36/37 están ahí pero se los come la PSRAM), 19/20 (USB nativo), 43/44 (UART0), 0/45/46 (strapping; el 0 además es el BOOT de recuperación).

| Pin | Qué | Hacia | Nota |
|---|---|---|---|
| 3 | ÚNICO pin libre | strapping (JTAG_SEL): usable como salida, sin nada colgado al bootear |  |
| 35 | 35 / 36 / 37 | están en el header pero los usa la PSRAM octal — tocarlos = boot loop |  |
| 45 | 0 / 45 / 46 | strapping: deciden el modo de boot. 0 = BOOT, reservado |  |

### 💡 ¿Un segundo pin de datos para los LEDs?

No, y no lo necesitás. Las 2 placas de 4 LEDs ya son 8 píxeles direccionables de a uno sobre GPIO9: encadenarlas no las hace dependientes, cada WS2812B tiene su propio controlador. Lo que hoy las pinta iguales es el firmware, no el cable — leds::setLayerColor() recorre NEOPIXEL_COUNT pintando el MISMO color en todos. Efectos por zona (placa A ≠ placa B) salen cambiando ese loop, sin tocar el soldador. Si igual quisieras un bus separado, el único pin libre es el GPIO3 (strapping): gastarías tu último pin de reserva a cambio de nada.

## BOM

| Cant. | Componente | Función | Notas | Fuente |
|---|---|---|---|---|
| 1 | ESP32-S3-DevKitC-1 N16R8 | MCU | 16MB flash + 8MB PSRAM octal | `projects/pad/README.md` |
| 1 | Pantalla ILI9488 4" SPI 480×320 | Display | si trae buffer 74HC245, VCC a 3V3 | `config/pinouts/pad.ts` |
| 1 | Encoder KY-040 | Navegación | a 3V3 | `projects/pad/README.md` |
| 1 | Joystick HW-504 | Mouse / navegación | a 3V3 aunque el silk diga +5V | `projects/pad/README.md` |
| 12 | Pulsador NA | 10 teclas de acción + 2 ALT |  | `projects/pad/README.md` |
| 10 | Diodo 1N4148 | Matriz 2×5 (uno por tecla) | cátodo hacia la FILA | `projects/pad/README.md` |
| 2 | MAX98357A breakout | Audio estéreo I2S | bus compartido | `projects/pad/README.md` |
| 1 | Resistencia 360kΩ | SD del ampli derecho → Vin | ejemplo a 5V sin pull-up en la placa; recalcular si el breakout trae uno | `config/pinouts/pad.ts` |
| 2 | Parlante 4–8Ω | Salida L y R | ningún borne a GND | `config/pinouts/pad.ts` |
| 2 | Placa WS2812B ×4 LEDs | Iluminación (8 píxeles) | encadenadas en GPIO9 | `projects/pad/README.md` |
| 1 | Resistencia 330Ω | Serie en DIN de NeoPixel |  | `projects/pad/README.md` |
| 1 | Diodo 1N400x | Serie en VCC de NeoPixel (nivel lógico) | alternativa: 74AHCT125 | `config/pinouts/pad.ts` |
| 1 | Cargador BMS 2S USB-C | Carga y protección |  | `projects/pad/README.md` |
| 2 | Celda 18650 | Batería 2S |  | `projects/pad/README.md` |
| 1 | LM2596S con display | Regulador a 5.0V | buck ≥3A | `config/pinouts/pad.ts` |
| 1 | Interruptor SW-CELDAS | Corte general BAT+ → buck | ≥3A | `config/pinouts/pad.ts` |
| 1 | Interruptor SW-PANTALLA | Corte del backlight (GPIO21 → LED) | nunca en el VCC de la pantalla | `config/pinouts/pad.ts` |
| 1 | Capacitor 470–1000µF | Bulk en el riel 5V |  | `config/pinouts/pad.ts` |
| 1 | Capacitor 1000µF | Reserva cerca de los amplis |  | `config/pinouts/pad.ts` |
| 7 | Piezas impresas 3D | Carcasa, tapa, placa, marcos y soportes | STL en public/downloads/pad/ | `config/prints/padPrints.ts` |

`¿?` = la cantidad no está documentada todavía.

## Checklist antes de energizar

- [ ] Buck medido a 5.0V ANTES de conectar el S3 (≥3A: 2 amplis + NeoPixel + backlight pican ~2.6A)
- [ ] Buck con headroom real: a 6.0V de entrada un buck no-síncrono se cae de regulación — cortá el pack a ~7.0V
- [ ] Masa común con continuidad (batería−, buck, S3, TFT, stick, encoder, matriz, ALT, amplis, NeoPixel)
- [ ] Cap bulk 470–1000µF en el riel 5V + 1000µF cerca de los amplis (polaridad OK)
- [ ] Stick y encoder al riel 3V3 (NO 5V) — verificado con multímetro
- [ ] Pantalla: si tiene buffer 74HC245 junto al header, su VCC va a 3V3 (si no, pantalla en blanco)
- [ ] SW-PANTALLA en la línea LED/BL, NUNCA cortando el VCC de la pantalla (abs-max del ILI9488)
- [ ] TFT: CS=10, MOSI=11, SCLK=12, DC=13, RST=14, BL=21 (verificado contra platformio.ini)
- [ ] TFT: el MISO/SDO NO se cablea (TFT_MISO=-1, sólo escribimos)
- [ ] Matriz acción: 2 filas (15/16 = OUTPUT) + 5 columnas (18/8/38/39/47 = INPUT_PULLUP)
- [ ] 10 diodos (uno por botón de acción), cátodo (raya) hacia la FILA → evita ghosting (si no registra, dalos vuelta)
- [ ] Diodos: 1N4148 (chico) o cualquier silicio: 1N400x/1N540x sirven igual (más grandes). LEDs NO
- [ ] ALT1→GPIO17, ALT2→GPIO48 DIRECTOS a GND (INPUT_PULLUP), SIN diodo (fila nav)
- [ ] Encoder KY-040: CLK=GPIO4, DT=GPIO5, SW=GPIO6, + a 3V3 (si gira al revés, permutá CLK y DT)
- [ ] Stick HW-504: VRx=GPIO1, VRy=GPIO2, SW=GPIO7 — los ejes en ADC1, el único que anda con la radio prendida
- [ ] NeoPixel: 330Ω en serie en DIN (GPIO9) + 1N400x en el VCC de la tira (o 74AHCT125) + cap en su 5V
- [ ] NeoPixel: las 2 placas ENCADENADAS (DOUT de la A → DIN de la B) = 8 píxeles en un solo pin; NEOPIXEL_COUNT=8
- [ ] I2S: BCLK=40, LRC=41, DIN=42 cableados a AMBOS amplis (bus compartido)
- [ ] A 5V sin pullup en la placa: Ampli-L SD→Vin · Ampli-R SD→360k a Vin, SD ~1.09V (ventana garantizada 0.825–1.245V). Si hay pullup, usá el cálculo de SD.
- [ ] GAIN de cada ampli sin conectar (=9dB) · parlante 4–8Ω directo (filterless, NO lo pruebes con carga resistiva)
- [ ] Parlantes: cada uno a los DOS bornes de SU ampli — ningún borne va a GND (la salida es diferencial)
- [ ] SW-CELDAS corta BAT+ → buck
- [ ] 1er flasheo por cable; después OTA (--upload-port hiospad.local)
- [ ] BOOT (GPIO0) + USB-C nativo accesibles para recuperación ante OTA fallido
