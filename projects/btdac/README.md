# HIOS BTDAC — Receptor Bluetooth + DAC PCM5102

Receptor de audio **Bluetooth A2DP** con ESP32 y DAC PCM5102. Entrega audio estéreo por salida de línea y mantiene un canal **BLE** para solicitar tonos de prueba desde la aplicación Android. HW **rev 2.0** · firmware/app **v0.5**.

## Primeros pasos

**Firmware (ESP32):**

```bash
cd projects/btdac
pio run -t upload             # compilar y flashear (PlatformIO, partición min_spiffs)
pio device monitor -b 115200  # logs de conexión y comandos
```

PlatformIO descarga las dependencias necesarias durante la primera compilación.

**App Android (control):** abrí `android/` en Android Studio, o `./gradlew installDebug` (JDK 17+). Detalle en [`android/README.md`](android/README.md).

## Funciones disponibles

El BTDAC v2 es **Dual Mode**:

1. **Audio Sink (Classic BT):** recibe A2DP estéreo 44.1kHz/16-bit → PCM5102 → salida de línea.
2. **Control BLE:** canal GATT independiente para solicitar tonos de prueba desde la app. El firmware genera una señal senoidal durante aproximadamente dos segundos y no inicia el tono mientras hay música en reproducción.

## Cableado

Hoja verificada contra el firmware: guía **[/pinouts/btdac](https://openhios.dev/pinouts/btdac)** (se auto-verifica contra `src/HIOS_BTDAC.ino` en cada `npm run test:wiring`). Resumen:

| Bus | ESP32 | A |
|---|---|---|
| I2S BCK | GPIO27 | PCM5102 BCK |
| I2S LRCK | GPIO14 | PCM5102 LRCK |
| I2S DIN | GPIO13 | PCM5102 DIN |
| — | GND | PCM5102 **SCK → GND** (activa el PLL interno; el pin 3.3V del módulo queda **sin conectar**) |
| LED R/G/B | GPIO4 / GPIO16 / GPIO17 | KY-009, cada color por **330Ω**, cátodo común a GND |
| 5V / GND | VIN / GND | del LM2596 (buck a 5.0V) |

**Jumpers del PCM5102 (atrás):** `FLT=L · DEMP=L · XSMT=H · FMT=L`. **XSMT=H es obligatorio** — en L el DAC queda muteado (silencio).

**GPIO a evitar en el WROOM-32:** 0 / 2 / 12 / 15 (strapping/boot) y 6–11 (flash SPI interno — no usar).

**LED de estado (KY-009):** barrido R→G→B al arrancar (self-test) y verde fijo = conectado; el firmware también señaliza conectando/reproduciendo/error por color (ver `src/HIOS_BTDAC.ino` para el mapa exacto). La lectura del nivel de batería todavía no está implementada.

## Hardware (BOM)

Batería 2S, salida de línea:

| Componente | Función | Características |
|---|---|---|
| ESP32-WROOM-32 DevKit (38 pines) | MCU + BT/BLE/WiFi | dual-core, BT 4.2, 4MB flash |
| PCM5102 (LAB1) | DAC I2S | TI PCM5102A, SNR 112dB, salida 2.1V RMS, PLL interno (SCK→GND) |
| LM2596S c/display | Regulador a 5.0V | Capacidad de corriente según módulo y disipación |
| KY-009 | LED RGB de estado | cátodo común, **sin** R integradas (van 3× 330Ω) |
| Cargador BMS 2S USB-C | Carga y protección del pack | Verificá tensión, corriente y protecciones en la ficha del módulo utilizado |
| 2× 18650 (serie/2S) | batería | Pack 2S; autonomía sin medición de referencia publicada |

> Usá un portapilas para dos celdas en **serie (2S)** y verificá su configuración antes de conectarlo al BMS.

## Secuencia de armado

Herramientas: soldador punta fina, estaño 60/40, multímetro, pinzas, pelacables.

1. **Energía primero.** Baterías → BMS 2S (B+/B−, y **BM al punto medio** entre celdas) → LM2596. **Ajustá el buck a 5.0V con el multímetro. NO conectes nada más hasta tener 5V estables.**
2. **PCM5102:** configurá los jumpers (FLT/DEMP/FMT=L, **XSMT=H**) y puenteá **SCK→GND**.
3. **ESP32:** VIN←5V, GND común. Probá que arranca por USB.
4. **I2S:** GPIO27→BCK, GPIO14→LRCK, GPIO13→DIN (cables cortos, <10cm).
5. **LED KY-009:** GPIO4/16/17 → 330Ω → R/G/B; cátodo → GND.
6. **Alimentá el PCM5102:** VIN←5V, GND, SCK→GND.

**Desacople (baja ruido de audio):** 100µF + 100nF cerca del VIN del ESP32; 10µF + 100nF cerca del VIN del PCM5102.

**Antes de conectar los módulos:** con la alimentación desconectada, verificá continuidad entre las masas y ausencia de cortocircuitos entre 5V y GND. Comprobá por separado que la salida del regulador esté ajustada a 5.0V. Fotos en `pics/build/` y `pics/modules/`.

## Protocolo de control (BLE)

Servicio GATT propio:

- **Service UUID:** `4fafc201-1fb5-459e-8fcc-c5c9c331914b`
- **Char UUID:** `beb5483e-36e1-4688-b7f5-ea07361b26a8`

| Comando | Ejemplo | Qué hace |
|---|---|---|
| `tone:FREQ` | `tone:1000` | genera un seno de esa frecuencia por ~2s (prueba de audio) |

`vol:` / `eq:` todavía **no** existen en el firmware (roadmap). Detalle de la app en [`android/README.md`](android/README.md).

## Diagnóstico de audio

Si Bluetooth conecta pero la salida presenta ruido o no reproduce música, revisá la configuración, el cableado y la alimentación:

1. **Test aislado:** flasheá `tests/HIOS_BTDAC_minimal_test.ino` (usa los **mismos** pines 27/14/13 que el firmware). Compará el resultado con el firmware completo para acotar el diagnóstico; esta prueba por sí sola no identifica la causa.
2. **SCK→GND:** sin eso el DAC no genera su clock. Medí continuidad SCK↔GND (~0Ω).
3. **XSMT=H:** en L el DAC está muteado.
4. **I2S:** continuidad 27→BCK, 14→LRCK, 13→DIN (~0Ω). Una lectura de tensión con multímetro no permite validar la comunicación I2S.
5. **Cables I2S <10cm** y **GND común** (ESP32 y PCM5102 unidos).
6. **VIN 5V estable** al reproducir. Si la tensión cae, revisá la fuente, el regulador y las conexiones.

Referencias: [ESP32-A2DP wiki](https://github.com/pschatzmann/ESP32-A2DP/wiki) · [PCM5102 datasheet](https://www.ti.com/lit/ds/symlink/pcm5102.pdf).

## Estado

Funciones implementadas y ampliaciones pendientes:

- [x] Firmware Dual Mode (A2DP + BLE simultáneos)
- [x] App Android (scan + connect + tonos)
- [x] Generador de tonos remoto
- [ ] Monitor de batería (HW v2) · Ecualizador DSP · WiFi Hi-Res (FLAC/DLNA) · OTA desde la app

## Licencia

Consultá las condiciones de licencia de cada dependencia antes de redistribuirla. Este directorio no incluye un archivo de licencia propio.

---

_HIOS BTDAC — HI Open Systems_
