# HIOS BTDAC — Receptor Bluetooth + DAC PCM5102

Receptor de audio **Bluetooth A2DP** de alta fidelidad con control por **BLE**: recibe música (A2DP) y la saca por un DAC PCM5102 (SNR 112dB), mientras un canal BLE simultáneo lo controla desde la app Android sin cortar el audio. HW **rev 2.0** · firmware/app **v0.5**.

## Quick Start

**Firmware (ESP32):**

```bash
cd projects/btdac
pio run -t upload             # compilar y flashear (PlatformIO, partición min_spiffs)
pio device monitor -b 115200  # logs de conexión y comandos
```

La primera vez baja las libs de Dual Mode (A2DP + BLE).

**App Android (control):** abrí `android/` en Android Studio, o `./gradlew installDebug` (JDK 17+). Detalle en [`android/README.md`](android/README.md).

## ¿Qué es?

El BTDAC v2 es **Dual Mode**:

1. **Audio Sink (Classic BT):** recibe A2DP estéreo 44.1kHz/16-bit → PCM5102 → salida de línea.
2. **Smart Control (BLE):** canal GATT simultáneo para manejarlo desde la app sin interrumpir la música. Incluye un **generador de tonos** por software (seno inyectado al buffer I2S) para pruebas.

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

**LED de estado (KY-009):** barrido R→G→B al arrancar (self-test) y verde fijo = conectado; el firmware también señaliza conectando/reproduciendo/error por color (ver `src/HIOS_BTDAC.ino` para el mapa exacto). El monitor de batería es HW v2, todavía no.

## Hardware (BOM)

Batería 2S, salida de línea:

| Componente | Función | Specs clave |
|---|---|---|
| ESP32-WROOM-32 DevKit (38 pines) | MCU + BT/BLE/WiFi | dual-core, BT 4.2, 4MB flash |
| PCM5102 (LAB1) | DAC I2S | TI PCM5102A, SNR 112dB, salida 2.1V RMS, PLL interno (SCK→GND) |
| LM2596S c/display | Buck 5.0V | 1.25–37V ajust., ~3A c/disipador, ~95% |
| KY-009 | LED RGB de estado | cátodo común, **sin** R integradas (van 3× 330Ω) |
| Cargador BMS 2S USB-C | carga + protección | 8.4V full, 2.2A carga, entrada 5V/4A |
| 2× 18650 (serie/2S) | batería | 7.4V nom → 8.4V full, >12h autonomía |

> ⚠️ El portapilas es **serie (2S)**: si conseguís uno paralelo (el SKU común), hay que **modificarlo a serie**. El pack es 7.4V nominal, no 3.7V.

## Armado (el orden importa)

Herramientas: soldador punta fina, estaño 60/40, multímetro, pinzas, pelacables.

1. **Energía primero.** Baterías → BMS 2S (B+/B−, y **BM al punto medio** entre celdas) → LM2596. **Ajustá el buck a 5.0V con el multímetro. NO conectes nada más hasta tener 5V estables.**
2. **PCM5102:** seteá los jumpers (FLT/DEMP/FMT=L, **XSMT=H**) y puenteá **SCK→GND**.
3. **ESP32:** VIN←5V, GND común. Probá que arranca por USB.
4. **I2S:** GPIO27→BCK, GPIO14→LRCK, GPIO13→DIN (cables cortos, <10cm).
5. **LED KY-009:** GPIO4/16/17 → 330Ω → R/G/B; cátodo → GND.
6. **Alimentá el PCM5102:** VIN←5V, GND, SCK→GND.

**Desacople (baja ruido de audio):** 100µF + 100nF cerca del VIN del ESP32; 10µF + 100nF cerca del VIN del PCM5102.

**Antes de encender:** continuidad de GND (0Ω entre todas las masas), sin corto 5V↔GND (∞), buck a 5.0V ±0.1. Fotos en `pics/build/` y `pics/modules/`.

## Protocolo de control (BLE)

Servicio GATT propio:

- **Service UUID:** `4fafc201-1fb5-459e-8fcc-c5c9c331914b`
- **Char UUID:** `beb5483e-36e1-4688-b7f5-ea07361b26a8`

| Comando | Ejemplo | Qué hace |
|---|---|---|
| `tone:FREQ` | `tone:1000` | genera un seno de esa frecuencia por ~2s (prueba de audio) |

`vol:` / `eq:` todavía **no** existen en el firmware (roadmap). Detalle de la app en [`android/README.md`](android/README.md).

## Troubleshooting (audio)

Síntoma típico: BT conecta y el LED anda, pero se escucha **fritura/ruido, no música**. Casi siempre es el PCM5102:

1. **Test aislado:** flasheá `tests/HIOS_BTDAC_minimal_test.ino` (usa los **mismos** pines 27/14/13 que el firmware). Si suena → el problema estaba en la config I2S del firmware completo; si no → es hardware/cableado.
2. **SCK→GND:** sin eso el DAC no genera su clock. Medí continuidad SCK↔GND (~0Ω).
3. **XSMT=H:** en L el DAC está muteado.
4. **I2S:** continuidad 27→BCK, 14→LRCK, 13→DIN (~0Ω). Con BT conectado esos pines deben medir ~1.5V DC oscilando (0V = no transmite; 3.3V fijo = mala config).
5. **Cables I2S <10cm** y **GND común** (ESP32 y PCM5102 unidos).
6. **VIN 5V estable** al reproducir (si cae, el buck no da corriente).

Refs: [ESP32-A2DP wiki](https://github.com/pschatzmann/ESP32-A2DP/wiki) · [PCM5102 datasheet](https://www.ti.com/lit/ds/symlink/pcm5102.pdf).

## Estado

**Fase 2 (Smart Audio)** — arquitectura híbrida funcional:

- [x] Firmware Dual Mode (A2DP + BLE simultáneos)
- [x] App Android (scan + connect + tonos)
- [x] Generador de tonos remoto
- [ ] Monitor de batería (HW v2) · Ecualizador DSP · WiFi Hi-Res (FLAC/DLNA) · OTA desde la app

## Licencia

Open Hardware — usá, modificá y compartí libremente · [openhios.dev/projects/btdac](https://openhios.dev/projects/btdac)

---

_HIOS BTDAC — HI Open Systems_
