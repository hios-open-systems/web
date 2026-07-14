# HIOS PAD — Cableado v2 (carcasa, SIN placa de expansión) · rev 0.8

> Build del **prototipo 2 / rev 0.8**: todo en carcasa, sin placa de expansión (por tamaño).
> Componentes: **12 botones (10 acción + 2 alt)**, **1 encoder**, **1 stick**, **tira NeoPixel** (carcasa transparente). La tensión de batería la muestra la pantalla de la fuente (no se mide en el pad).
> Los 3 rieles (5V / 3V3 / GND) se arman **a mano**.
> ⚠️ Este doc es el cableado **rev 0.8** (12 botones DIRECTOS, un GPIO cada uno). Quedó **superado por la rev 0.9**, que pasa las 10 teclas de acción a una **matriz 2×5 con diodos** para liberar 3 GPIO y meter los parlantes I2S.
>
> Para soldar, usá **/pinouts/pad** en el sitio (o [`PINOUT.md`](PINOUT.md)): están verificados contra el firmware por self-test. Este archivo se conserva como historia del prototipo 2.
> Para el prototipo 1 (con expansión) ver [`WIRING.md`](WIRING.md).

## Resumen de la decisión

- **5V**: viene del **buck regulable seteado a 5.0V**. Energiza todo el sistema.
- **3V3**: lo genera el **propio S3** (regulador AMS1117 a bordo). Sale por el pin `3V3` del DevKitC.
- **GND**: **una sola masa común** para absolutamente todo (estrella/riel único).
- **Pantalla → 5V** (módulo ILI9488 con regulador + level-shifter a bordo).
- **Stick → 3V3** (a 5V sobre-volta el ADC y acopla los ejes — gotcha conocido).
- **Encoder KY-040 → 3V3** (trae pull-ups a bordo: a 5V mete 5V en los GPIO del S3).
- **12 botones (10 acción + 2 alt) → sin VCC** (cada uno: GPIO + GND, `INPUT_PULLUP` interno). Cableado directo 1:1.
- **NeoPixel → dato en GPIO9** (ex-divisor de batería, pin limpio), alimentado del riel 5V. Toda la tira = **1 solo pin** (se encadenan).
- **Batería: no se mide en el pad** — la pantalla de la fuente ya muestra la tensión de entrada (= las 2 celdas). Por eso GPIO9 quedó libre para el NeoPixel.
- **Flasheo: por cable (UART0/CH343, auto-reset) y/u OTA por WiFi.** GPIO43/44 siguen como UART → serial debug intacto.
- **2 switches**: `SW-CELDAS` (corta toda la energía) y `SW-PANTALLA` (apaga solo la TFT, queda el teclado).

## Cadena de energía

```
 ┌─────────────┐
 │   Cargador  │  (carga + pass-through del pack 2S)
 │     2S      │
 └─────┬───┬───┘
       │   └────────────────┐
   (carga)              [ BAT+ ]  nodo común: celdas + entrada del buck
       │                    │
 ┌─────┴─────┐
 │  2 celdas │              ●──[SW-CELDAS]──► VBAT_SW (6.0–8.4 V)
 │  Li-ion   │                                 │
 │   (2S)    │                          ┌──────┴──────┐
 └─────┬─────┘                          │ Buck reg.   │   (la pantalla de la
       │                                │  IN  → 5.0V │    fuente muestra VBAT)
      GND ───────────────────────────── └──────┬──────┘
                                           [ 5V RAIL ]
                                                │
        ┌───────────────────────────────────────┼───────────────────┐
        │                                        │                   │
   ESP32 "5V" pin                          [SW-PANTALLA]        (cap bulk
        │                                        │            470–1000µF
   (AMS1117 a bordo)                        Display VCC          en 5V RAIL)
        │                                   + backlight
   ESP32 "3V3" pin
        │
   [ 3V3 RAIL ] ──► Stick VCC + Encoder "+"
```

> **Brownout v1 = resuelto.** En v1 entrábamos con 6.5 V al borde del regulador de la expansión y loopeaba bajo picos WiFi+BLE. Ahora el buck entrega **5 V firmes directo al pin `5V`** → mucho más headroom. **Igual:** poné un **cap bulk de 470–1000 µF** en el riel 5V cerca del S3 para los picos de los radios, y usá un buck de **≥1 A**.

## Net list (conexión por conexión)

### Energía

| Desde | Hasta | Notas |
|---|---|---|
| Cargador OUT+ | BAT+ (pack 2S +) | el cargador carga y queda en paralelo al pack |
| Cargador OUT− | GND | |
| BAT+ | `SW-CELDAS` (común) | switch que corta TODO |
| `SW-CELDAS` (salida) | Buck IN+ → nodo **VBAT_SW** | 6.0–8.4 V (la pantalla de la fuente lo muestra) |
| GND | Buck IN− | |
| Buck OUT+ (5.0 V) | **riel 5V** | medí con multímetro y dejalo en 5.0 V exactos |
| Buck OUT− | GND | |
| riel 5V | ESP32 pin **`5V`** | alimenta el S3 (VBUS interno → AMS1117) |
| riel 5V | cap bulk + → GND | 470–1000 µF electrolítico |
| riel 5V | `SW-PANTALLA` (común) | switch que apaga solo la pantalla |
| ESP32 pin **`3V3`** | **riel 3V3** | lo da el AMS1117 del DevKitC |

> ⛔ **Nunca** metas tensión al pin `3V3` desde afuera (saltea el regulador). El 3V3 **sale** del S3, no entra.
> ⛔ Con el sistema prendido por batería **NO enchufes USB** sin antes abrir `SW-CELDAS`: el VBUS del USB y la salida del buck pelearían en el pin `5V`. Para **flashear por cable**: abrí `SW-CELDAS` y enchufá el USB (UART/CH343). (O flasheá por **OTA** sin tocar nada.)

### Pantalla TFT (ILI9488, HSPI) — VCC a 5V vía `SW-PANTALLA`

| Pin módulo | Va a | GPIO / riel |
|---|---|---|
| VCC | `SW-PANTALLA` (salida) → **VDISP_5V** | 5V conmutado |
| GND | GND | |
| LED (backlight) | ESP32 **GPIO21** | control PWM (la corriente del LED sale de VCC internamente) |
| CS | ESP32 **GPIO10** | |
| RST | ESP32 **GPIO14** | |
| DC / RS | ESP32 **GPIO13** | |
| SDI / MOSI | ESP32 **GPIO11** | |
| SCK / SCL | ESP32 **GPIO12** | |
| SDO / MISO | — | NC (solo escribimos) |

### Stick HW-504 → 3V3

| Pin | Va a | GPIO / riel |
|---|---|---|
| +5V/VCC | **riel 3V3** | ⚠️ 3V3, **NO** 5V |
| GND | GND | |
| VRx | ESP32 **GPIO1** | ADC1 |
| VRy | ESP32 **GPIO2** | ADC1 |
| SW | ESP32 **GPIO7** | `INPUT_PULLUP` |

### Encoder KY-040 → 3V3

| Pin | Va a | GPIO / riel |
|---|---|---|
| + (VCC) | **riel 3V3** | ⚠️ 3V3 (sus pull-ups fijan el nivel de salida) |
| GND | GND | |
| CLK | ESP32 **GPIO4** | |
| DT | ESP32 **GPIO5** | |
| SW | ESP32 **GPIO6** | `INPUT_PULLUP` |

### 12 botones (10 acción + 2 alt) — sin VCC

Una pata de cada botón al GPIO, la otra a **GND común**. NA, `INPUT_PULLUP` (activos en bajo).

| Etiqueta | GPIO | Notas |
|---|---|---|
| ACC1 | **GPIO15** | |
| ACC2 | **GPIO16** | |
| ACC3 | **GPIO17** | |
| ACC4 | **GPIO18** | |
| ACC5 | **GPIO8** | ADC1 (usado como digital, OK) |
| ACC6 | **GPIO38** | (puede ser el LED RGB del DevKitC según rev — no lo usamos) |
| ACC7 | **GPIO39** | |
| ACC8 | **GPIO40** | |
| ACC9 | **GPIO41** | |
| ACC10 | **GPIO42** | |
| ALT1 | **GPIO47** | modificador |
| ALT2 | **GPIO48** | modificador (puede ser el LED RGB según rev — no lo usamos) |

> Estos 12 pines **agotan los GPIO libres** del S3 (ver "Presupuesto de pines"). El reparto acción/alt es lógico: el firmware decide cuáles 2 son modificadores; eléctricamente son todos botones iguales a GND.
> Tip de cableado: llevá **un solo cable de GND** a una regleta/anillo común y de ahí a la segunda pata de los 12 botones (margarita), en vez de 12 cables a la masa.

### Tira NeoPixel (WS2812 / SK6812) — dato en GPIO9

> **Decisión rev 0.8:** el NeoPixel va en **GPIO9** (el pin que iba a ser el divisor de batería), no en GPIO43. GPIO9 es un pin limpio → **UART0 (43/44) queda libre** para el serial y el flasheo por cable con auto-reset (CH343), y **sin parpadeo de boot** en los LEDs. La medición de batería en el pad se descarta (la pantalla de la fuente ya muestra la tensión de entrada = las 2 celdas).

| Pin tira | Va a | Notas |
|---|---|---|
| DIN (datos) | ESP32 **GPIO9** (vía **330 Ω** en serie) | ADC1 usado como digital. Toda la tira usa este único pin (DIN→DOUT encadenado) |
| VCC (+) | **riel 5V** | ~60 mA/LED a blanco pleno → limitá brillo en firmware; cap **470–1000 µF** en el 5V de la tira |
| GND | GND común | |

⚠️ **Gotcha de nivel (3.3 V → 5 V):** el S3 maneja datos a 3.3 V y el WS2812 a 5 V quiere un "1" de ~3.5 V → dato marginal (parpadeos). Soluciones (una):
- **Level-shifter** 74AHCT125 en la línea de datos (lo más robusto), o
- usar **SK6812** (más tolerante a 3.3 V), o
- alimentar la tira a **~4.0–4.3 V**.

> Como GPIO9 no es pin de UART ni de boot-log, **no hay parpadeo de arranque** ni necesidad del viejo `SW-FLASH`. Igual el firmware deja los pixeles en estado conocido como primera acción del `setup()`.

## Batería — medición descartada en el pad

No se mide la batería en el pad: la **pantalla de la fuente** (buck regulable) ya muestra la **tensión de entrada**, que es la del pack 2S en serie (6.0–8.4 V). Eso alcanza como gauge.

- GPIO9 (que iba a ser el divisor) **ahora maneja el NeoPixel**.
- En `Config.h`: `BATTERY_ENABLED = false` (no encender sin reasignar `BAT_ADC_PIN` a otro ADC1 libre, o chocaría con el NeoPixel).
- Si algún día querés medirla en el pad: divisor 100k/47k (8.4 V → 2.69 V) a un ADC1 libre, o reportarla por el companion.
## Los 2 switches

### `SW-CELDAS` — corta toda la energía (SPST)

- **Dónde**: en serie entre **BAT+** y la **entrada del buck** (corta VBAT_SW).
- **Función**: apagado total / transporte / almacenamiento.
- Corriente que maneja: la del sistema entero (picos WiFi+BLE) → elegí un switch de **≥2 A**.

### `SW-PANTALLA` — apaga solo la TFT, queda el teclado (SPST)

- **Dónde**: en serie en el **VCC** de la pantalla (5V → VDISP_5V). Corta lógica + backlight (el backlight se alimenta de VCC internamente).
- **Función**: "solo teclado", ahorra el consumo más grande (backlight de la 3.5").
- Corriente: la de la pantalla (~100–150 mA) → cualquier switch chico sirve.

> 🔧 **Caveat de prolijidad (opcional):** con la pantalla apagada por hardware, el S3 sigue manejando las líneas SPI (CS/DC/RST/MOSI/SCLK/LED) a 3.3 V contra un módulo sin VCC → un poco de back-feed por los diodos de ESD (corriente chica, tolerable). Para que quede 100% limpio, lo ideal es que el firmware ponga esos pines en LOW / tri-state cuando la pantalla está off.
> Para sensar `SW-PANTALLA` por hardware (y que el firmware corte el bus SPI solo) usá **GPIO3** (último comodín libre). UART0 (43/44) ahora está ocupado por serial/flasheo.

## Mapa de pines completo (v0.8)

| Función | GPIO | Riel | Notas |
|---|---|---|---|
| Botones acción ACC1–10 | 15, 16, 17, 18, 8, 38, 39, 40, 41, 42 | — | NA a GND, `INPUT_PULLUP` |
| Botones ALT1 / ALT2 | 47, 48 | — | modificadores |
| Encoder CLK / DT / SW | 4 / 5 / 6 | 3V3 | KY-040; SW pull-up |
| Stick X / Y / SW | 1 / 2 / 7 | 3V3 | X/Y en ADC1; SW pull-up |
| **NeoPixel DIN** | **9** | (datos) | ex-batería; ADC1 como digital; 330 Ω + level-shifter/SK6812 |
| TFT MOSI/SCLK/CS/DC/RST | 11 / 12 / 10 / 13 / 14 | VCC=5V | ILI9488, HSPI |
| TFT backlight (LED) | 21 | (PWM) | LEDC por software |
| UART0 TX / RX | 43 / 44 | — | serial + flasheo por cable (CH343, auto-reset) |
| USB nativo (HID) | 19 / 20 | — | `ARDUINO_USB_MODE=0` |

### Presupuesto de pines

GPIO del S3 **no usables**: 26–32 (flash interno), 33–37 (PSRAM octal), 19/20 (USB nativo), 0/3/45/46 (strapping), 43/44 (UART0 = serial/flasheo).
El NeoPixel entró en **GPIO9** (el pin que iba a medir batería; se descartó esa medición). Quedan en uso casi todos los GPIO usables; **GPIO3** es el último comodín (ej. sense de `SW-PANTALLA`). Para crecer más: expansor I2C (MCP23017) o matriz con diodos.

## Checklist de armado

1. [ ] Buck **seteado y medido a 5.0 V** *antes* de conectar el S3.
2. [ ] **Masa común** verificada con continuidad: batería−, buck (in/out)−, S3 GND, TFT GND, stick GND, encoder GND, botones, tira.
3. [ ] Cap bulk 470–1000 µF en el riel 5V (polaridad correcta).
4. [ ] Stick y encoder al **riel 3V3** (NO al 5V) — verificá con multímetro antes de enchufar.
5. [ ] Los **12 botones** a sus GPIO (ver tabla), segunda pata a la regleta de GND común.
6. [ ] NeoPixel: **330 Ω** en serie en DIN (**GPIO9**) + level-shifter/SK6812 + cap en su 5V.
7. [ ] `SW-CELDAS` corta VBAT_SW; `SW-PANTALLA` corta VCC de la TFT.
8. [ ] 1er flasheo por cable (UART0/CH343) o por **OTA** (`pio run -t upload --upload-port hiospad.local`).
9. [ ] (Opcional) sense de `SW-PANTALLA` en GPIO3.

## Firmware: HECHO (jul 2026)

Este doc listaba acá un refactor pendiente de "5 botones → 12". **Ya está hecho, y quedó atrás por partida doble:**

- El paso a **12 botones directos** (rev 0.8) se hizo: `BOTON[12]`, bitmask a `uint16_t`, `ButtonMatrix::N = 14`, picker de 10 teclas.
- Y después la **rev 0.9** reemplazó eso por la **matriz 2×5 escaneada** (`MTX_FILA[2]` + `MTX_COL[5]` + `ALT[2]` en [`Pins.h`](src/app/Pins.h)) y sumó el **bus I2S** para los dos MAX98357A ([`src/audio/`](src/audio/)).

O sea: los 12 GPIO directos que describe este archivo ya no existen en el firmware. Ver [`PINOUT.md`](PINOUT.md).

