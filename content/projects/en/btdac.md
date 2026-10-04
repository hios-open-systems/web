# HIOS BTDAC — Bluetooth receiver + PCM5102 DAC

**Bluetooth A2DP** audio receiver with an ESP32 and PCM5102 DAC. It provides stereo line output and a **BLE** channel for requesting test tones from the Android app. Hardware **rev 2.0** · firmware/app **v0.5**.

## Getting started

**Firmware (ESP32):**

```bash
cd projects/btdac
pio run -t upload             # build and upload (PlatformIO, min_spiffs partition)
pio device monitor -b 115200  # connection and command logs
```

PlatformIO downloads the required dependencies during the first build.

**Android control app:** open `android/` in Android Studio, or run `./gradlew installDebug` (JDK 17+). See [`android/README.md`](android/README.md).

## Available features

BTDAC v2 uses **Dual Mode**:

1. **Audio sink (Classic Bluetooth):** receives stereo A2DP at 44.1kHz/16-bit → PCM5102 → line output.
2. **BLE control:** a separate GATT channel requests test tones from the app. The firmware generates a sine wave for approximately two seconds and does not start a tone while music is playing.

## Wiring

The **[/pinouts/btdac](https://openhios.dev/pinouts/btdac)** guide is checked against `src/HIOS_BTDAC.ino` by `npm run test:wiring`. Summary:

| Bus | ESP32 | Destination |
|---|---|---|
| I2S BCK | GPIO27 | PCM5102 BCK |
| I2S LRCK | GPIO14 | PCM5102 LRCK |
| I2S DIN | GPIO13 | PCM5102 DIN |
| — | GND | PCM5102 **SCK → GND** (internal PLL; leave the module's 3.3V pin **unconnected**) |
| LED R/G/B | GPIO4 / GPIO16 / GPIO17 | KY-009, **330Ω** per color, common cathode to GND |
| 5V / GND | VIN / GND | From the LM2596 (buck converter set to 5.0V) |

**PCM5102 jumpers (back):** `FLT=L · DEMP=L · XSMT=H · FMT=L`. **XSMT must be H**; L mutes the DAC.

**GPIOs to avoid on the WROOM-32:** 0 / 2 / 12 / 15 (strapping/boot) and 6–11 (internal SPI flash — do not use).

**KY-009 status LED:** R→G→B startup self-test; solid green means connected. Other colors indicate connecting, playback and errors; see `src/HIOS_BTDAC.ino` for the mapping. Battery level monitoring is not implemented yet.

## Hardware (BOM)

2S battery, line output:

| Component | Function | Characteristics |
|---|---|---|
| ESP32-WROOM-32 DevKit (38 pins) | MCU + BT/BLE/WiFi | Dual-core, BT 4.2, 4MB flash |
| PCM5102 (LAB1) | I2S DAC | TI PCM5102A, 112dB SNR, 2.1V RMS output, internal PLL (SCK→GND) |
| LM2596S with display | 5.0V regulator | Current capacity depends on the module and cooling |
| KY-009 | RGB status LED | Common cathode, **no** built-in resistors; add 3× 330Ω |
| USB-C 2S charger/BMS | Pack charging and protection | Check voltage, current and protection specifications for the module used |
| 2× 18650 (series/2S) | Battery | 2S pack; no reference battery-life measurement published |

> Use a holder for two cells in **series (2S)** and verify its configuration before connecting it to the BMS.

## Assembly sequence

Tools: fine-tip soldering iron, 60/40 solder, multimeter, tweezers and wire strippers.

1. **Power first:** batteries → 2S BMS (B+/B− and **BM to the midpoint** between cells) → LM2596. **Set the buck converter to 5.0V with a multimeter. Do not connect the other modules until the output is stable.**
2. **PCM5102:** set the jumpers (FLT/DEMP/FMT=L, **XSMT=H**) and bridge **SCK→GND**.
3. **ESP32:** VIN←5V, common GND. Check that it boots over USB.
4. **I2S:** GPIO27→BCK, GPIO14→LRCK, GPIO13→DIN; use short wires, under 10cm.
5. **KY-009 LED:** GPIO4/16/17 → 330Ω → R/G/B; cathode → GND.
6. **PCM5102 power:** VIN←5V, GND, SCK→GND.

**Decoupling:** 100µF + 100nF near the ESP32 VIN; 10µF + 100nF near the PCM5102 VIN to help reduce supply noise.

**Before connecting the modules:** with power disconnected, check ground continuity and the absence of shorts between 5V and GND. Separately verify that the regulator output is set to 5.0V. Photos: `pics/build/` and `pics/modules/`.

## BLE control protocol

Custom GATT service:

- **Service UUID:** `4fafc201-1fb5-459e-8fcc-c5c9c331914b`
- **Char UUID:** `beb5483e-36e1-4688-b7f5-ea07361b26a8`

| Command | Example | Effect |
|---|---|---|
| `tone:FREQ` | `tone:1000` | Generates a sine wave at that frequency for approximately 2s |

`vol:` and `eq:` are **not implemented** in the firmware. App details: [`android/README.md`](android/README.md).

## Audio troubleshooting

If Bluetooth connects but the output is noisy or does not play music, check configuration, wiring and power:

1. **Isolated test:** upload `tests/HIOS_BTDAC_minimal_test.ino`, which uses the **same** pins 27/14/13 as the firmware. Compare the result with the full firmware to narrow down the issue; this test alone does not identify the cause.
2. **SCK→GND:** check continuity for the internal PLL configuration.
3. **XSMT=H:** L mutes the DAC.
4. **I2S:** check continuity 27→BCK, 14→LRCK, 13→DIN. A multimeter voltage reading cannot validate I2S communication.
5. **I2S wires under 10cm** and **common GND** between ESP32 and PCM5102.
6. **Stable 5V VIN** during playback. If voltage drops, check the supply, regulator and connections.

References: [ESP32-A2DP wiki](https://github.com/pschatzmann/ESP32-A2DP/wiki) · [PCM5102 datasheet](https://www.ti.com/lit/ds/symlink/pcm5102.pdf).

## Status

Implemented features and planned extensions:

- [x] Dual Mode firmware (simultaneous A2DP + BLE)
- [x] Android app (scan, connect and test tones)
- [x] Remote tone generator
- [ ] Battery monitoring (hardware v2), DSP equalizer, WiFi Hi-Res (FLAC/DLNA), OTA from the app

## License

Check each dependency's license terms before redistribution. This directory does not include a license file of its own.

---

_HIOS BTDAC — HI Open Systems_
