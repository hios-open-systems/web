# HIOS PAD — Cableado y energía (PROTOTIPO 1 — SUPERADO)

> # ⛔ NO SOLDES CON ESTE DOCUMENTO
>
> Describe el **prototipo 1** (con placa de expansión), que ya no se arma. Se conserva
> como historia. Tenía **dos errores capaces de arruinarte hardware**, corregidos abajo
> pero mencionados acá para que nadie los repita de memoria:
>
> 1. La tabla de pines se leía como **TFT CS = 13**. El CS es el **10** (`platformio.ini`
>    manda). Soldarlo al 13 lo choca contra el DC → pantalla muerta.
> 2. Mandaba a cablear un **divisor de batería al GPIO9**. El GPIO9 hoy es el **DIN del
>    NeoPixel**: ese divisor le mete ~2,7 V DC permanentes a la línea de datos.
>
> **Para soldar, usá:**
> - **/pinouts/pad** en el sitio — es data-driven y un self-test la compara contra
>   `Pins.h` y `platformio.ini` en cada corrida.
> - [`WIRING_v2.md`](WIRING_v2.md) — el prototipo 2 (carcasa, sin expansión).
>
> Fuente de verdad de pines: `src/app/Pins.h` + build flags de `platformio.ini`.

## Energía (según el armado actual)

Cadena de alimentación:

```
Fuente regulada regulable (config. a 6.5 V)
        │
        ▼
Módulo cargador 2 celdas en serie (2S), 4 A ── a las 2 celdas (batería 2S)
        │  (salida 6.5 V regulados)
        ▼
Placa de expansión  ── ficha tipo "trafo" (DC jack), rango 6.5–9 V
        │  (regulador de la expansión → 5V / 3.3V)
        ▼
ESP32-S3 DevKitC-1  +  periféricos
```

A la **placa de expansión** se conecta todo: **encoder, botones, stick, pantalla**.

### ⚠️ Nota de energía / brownout (importante)
- Entrar con **6.5 V es el PISO del rango 6.5–9 V** → casi sin headroom para el regulador de la expansión.
- Bajo los **picos de corriente de WiFi + BLE** (y el backlight de la TFT), el riel cae → el detector de **brownout del S3 resetea** → **boot loop**.
- Observado: con la batería baja (cargando) loopea; a medida que la batería sube de voltaje, se estabiliza. Consistente con brownout.
- **Mitigaciones:**
  1. Subir la fuente regulada a **~7.5–8 V** (dentro del rango 6.5–9 V) → más headroom. (Lo más efectivo.)
  2. Fuente/cable de buena calidad y corriente (los picos WiFi+BLE son altos).
  3. Apagar **WiFi** cuando no se necesita feedback (un radio menos = menos consumo). Toggle on-device (long-press botón 5).
  4. (Software) bajar `WiFi.setTxPower` → picos más chicos.
- ⛔ **Nunca** alimentar el pin `3V3` directo (saltea el regulador → puede dañar el S3). Usar la ficha (6.5–9 V) o USB (5 V).

## Medición de batería (2S) — ⛔ DESCARTADA, NO LA CABLEES

> **El GPIO9 ya NO está libre: hoy es el DIN del NeoPixel** (`cfg::NEOPIXEL_PIN = 9`).
> Cablear este divisor le clava ~2,7 V DC permanentes, vía 47k, a la línea de datos que
> el S3 intenta manejar. `Config.h` todavía tiene `BAT_ADC_PIN = 9` y sólo se salva
> porque `BATTERY_ENABLED = false`: **no lo pongas en `true`** sin reasignar el ADC.
>
> La medición se descartó a propósito: la **pantalla de la fuente** ya muestra la tensión
> de entrada (= las 2 celdas). Los pasos de abajo quedan sólo como registro histórico.

<details>
<summary>Procedimiento viejo (no seguir)</summary>

1. **Cablear un divisor resistivo** de V+ de la batería (2S, hasta 8.4 V) al pin **GPIO9** (ADC1, libre):

   ```
   V+ batería ──[ R1 = 100k ]──┬──► GPIO9 (BAT_ADC_PIN)
                               │
                            [ R2 = 47k ]
                               │
                              GND
   ```
   `Vadc = Vbat · R2/(R1+R2)`. Con 100k/47k: **8.4 V → 2.69 V** (dentro del rango del ADC, con margen). Mantené R1+R2 altos (≥100k) para que el divisor no drene la batería.

2. Poner `BATTERY_ENABLED = true` en [`src/app/Config.h`](src/app/Config.h) (ajustá `BAT_R1_K`/`BAT_R2_K` a tus resistencias reales, y `BAT_FULL_MV`/`BAT_EMPTY_MV` si tu pack difiere de 8.4/6.0 V).

3. El ADC del S3 es **no-lineal**: si la lectura difiere, calibrá midiendo con multímetro en lleno/vacío y ajustando los `*_MV`. El firmware promedia 8 lecturas cada `BAT_SAMPLE_MS`.

> ⚠️ El valor llega a `UiSnapshot.battery` (0..100; 255 = sin dato), pero **falta el tile en la UI** (el dock tiene 5 tiles llenos): agregar el indicador cuando se valide la lectura en hardware.

</details>

## Mapa de pines (ESP32-S3)

| Función | GPIO | Notas |
|---|---|---|
| Botones 1–5 | 15, 16, 17, 18, 8 | NA a GND, `INPUT_PULLUP` (activos en bajo) |
| Encoder CLK / DT / SW | 4 / 5 / 6 | KY-040; SW `INPUT_PULLUP` |
| Stick X / Y / SW | 1 / 2 / 7 | X/Y en **ADC1**; SW `INPUT_PULLUP` |
| Batería (divisor) | 9 | ADC1, opcional; `BATTERY_ENABLED` |
| TFT MOSI / SCLK / **CS** / DC / RST | 11 / 12 / **10** / 13 / 14 | ILI9488, HSPI. MISO=-1. ⚠️ Esta fila decía `13(*)` para el CS y se leía como CS=13: **está mal**, el CS es el **10** (`platformio.ini` es la autoridad). |
| TFT backlight | 21 | PWM por software (LEDC) |
| USB nativo (HID) | 19 / 20 | `ARDUINO_USB_MODE=0` (TinyUSB OTG = HID) |
| UART/CH343 (debug+flasheo) | UART0 | `/dev/ttyACM0` vía usbipd en WSL |

> TFT exacto en `platformio.ini`: `TFT_MOSI=11 TFT_SCLK=12 TFT_CS=10 TFT_DC=13 TFT_RST=14 TFT_MISO=-1`, `ILI9488_DRIVER`, `USE_HSPI_PORT`, `SPI_FREQUENCY=27000000`.

## Gotchas de hardware (no re-pisar)
- **Stick HW-504 → alimentar a `3V3`, NO a 5 V.** A 5 V el wiper sobre-volta los pines ADC del S3 en el extremo alto → conduce el diodo de protección → **acopla los dos ejes** (diagonal). Mapeo correcto por el montaje: `MOUSE_SWAP_XY=true`, `MOUSE_INVERT_X=true`.
- **Módulo N16R8: SÍ tiene PSRAM** (8MB octal, AP Memory 3.3V — confirmado por chip dump). `platformio.ini` la habilita con `board_build.arduino.memory_type = qio_opi`; si ese flag estuviera mal, habría boot loop. La usa el monitor para sprites grandes / doble-buffer. **Costo:** la PSRAM octal se queda con los **GPIO 33–37**, y la flash con los **26–32** → ninguno de esos es usable, aunque el datasheet genérico del S3 los liste.
- **USB:** el nativo (303a) es HID; el UART (CH343) es serial/flasheo. Son puertos distintos. Auto-switch HID: si el nativo está enumerado por un host → USB; si no → BLE.

## Transportes / radios
- **HID a la PC:** USB (nativo) o BLE ("HIOS PAD"). Auto-switch por `tud_mounted()`.
- **WiFi:** SOLO para el feedback del companion (`POST /api/state`), NTP y el portal/QR. **No** transporta HID. Se puede apagar para ahorrar energía.
