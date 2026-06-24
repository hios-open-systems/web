# HIOS PAD — Cableado y energía

> Documento de hardware del macropad (ESP32-S3 DevKitC-1 + placa de expansión).
> Pines: fuente de verdad = `src/app/Pins.h` y los build flags de `platformio.ini`.

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

## Medición de batería (2S) — listo pero apagado

El firmware ya tiene el lector (`cfg::BATTERY_ENABLED`, hoy `false`). Para activarlo:

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

## Mapa de pines (ESP32-S3)

| Función | GPIO | Notas |
|---|---|---|
| Botones 1–5 | 15, 16, 17, 18, 8 | NA a GND, `INPUT_PULLUP` (activos en bajo) |
| Encoder CLK / DT / SW | 4 / 5 / 6 | KY-040; SW `INPUT_PULLUP` |
| Stick X / Y / SW | 1 / 2 / 7 | X/Y en **ADC1**; SW `INPUT_PULLUP` |
| Batería (divisor) | 9 | ADC1, opcional; `BATTERY_ENABLED` |
| TFT MOSI / SCLK / CS / DC / RST | 11 / 12 / 13(*) / 14(*) | ILI9488, HSPI. (Ver platformio.ini: CS=10, DC=13, RST=14, MISO=-1) |
| TFT backlight | 21 | PWM por software (LEDC) |
| USB nativo (HID) | 19 / 20 | `ARDUINO_USB_MODE=0` (TinyUSB OTG = HID) |
| UART/CH343 (debug+flasheo) | UART0 | `/dev/ttyACM0` vía usbipd en WSL |

> TFT exacto en `platformio.ini`: `TFT_MOSI=11 TFT_SCLK=12 TFT_CS=10 TFT_DC=13 TFT_RST=14 TFT_MISO=-1`, `ILI9488_DRIVER`, `USE_HSPI_PORT`, `SPI_FREQUENCY=27000000`.

## Gotchas de hardware (no re-pisar)
- **Stick HW-504 → alimentar a `3V3`, NO a 5 V.** A 5 V el wiper sobre-volta los pines ADC del S3 en el extremo alto → conduce el diodo de protección → **acopla los dos ejes** (diagonal). Mapeo correcto por el montaje: `MOUSE_SWAP_XY=true`, `MOUSE_INVERT_X=true`.
- **Módulo SIN PSRAM** (N16). Sin framebuffer completo → algo de barrido en redibujos completos (mitigado: redibujo por componente + SPI 27MHz). Un WROOM con sufijo **R** (ej. N16R8) tendría PSRAM → framebuffer posible.
- **USB:** el nativo (303a) es HID; el UART (CH343) es serial/flasheo. Son puertos distintos. Auto-switch HID: si el nativo está enumerado por un host → USB; si no → BLE.

## Transportes / radios
- **HID a la PC:** USB (nativo) o BLE ("HIOS PAD"). Auto-switch por `tud_mounted()`.
- **WiFi:** SOLO para el feedback del companion (`POST /api/state`), NTP y el portal/QR. **No** transporta HID. Se puede apagar para ahorrar energía.
