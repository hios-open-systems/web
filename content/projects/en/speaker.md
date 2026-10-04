# HIOS WiFi Speaker

ESP32 WiFi and Bluetooth speaker with **two MAX98357 I2S amplifiers for stereo output**, a 16×2 LCD and a USB-C rechargeable 2S battery. It plays WiFi radio, YouTube audio through Invidious and Bluetooth A2DP audio, with a web control interface.

## Getting started

```bash
cd projects/speaker
pio run -t upload             # build and upload with PlatformIO
pio device monitor -b 115200  # serial monitor
```

Once connected to the network, open **http://hios-speaker.local**.

## Playback modes

The firmware includes these modes (`Mode` enum in `src/main.ino`):

- **WiFi Radio:** preset stations or an audio URL.
- **YouTube:** audio through the Invidious API; availability depends on the instance and its compatibility.
- **Bluetooth A2DP:** receives audio from a phone or computer.
- **Bluetooth serial configuration:** set the WiFi network from a Bluetooth terminal without recompiling.

Audio goes over I2S to both MAX98357 modules, one amplifier per channel. The LCD shows mode, volume and title.

## Wiring

The **[/pinouts/speaker](https://openhios.dev/pinouts/speaker)** guide is checked against `src/main.ino` by `npm run test:wiring`. Summary:

| Bus | ESP32 | Destination |
|---|---|---|
| I2S DIN | GPIO25 | DIN on **both** MAX98357 modules (shared bus) |
| I2S BCLK | GPIO26 | BCLK on both modules |
| I2S LRC | GPIO27 | LRC on both modules |
| I2C SDA / SCL | GPIO21 / GPIO22 | 16×2 LCD (0x27) |
| VBAT | GPIO34 | Pack voltage divider, 100k/100k; IO34 is input-only |
| 5V / GND | VIN / GND | From the LM2596, set to 5.0V |

> **L/R channel selection:** both amplifiers share the I2S bus and select their channel through SD. Measure this pin's voltage and compare it with the module's datasheet. See the SD measurement step in the wiring guide.

## Components (BOM)

Stereo output, 2S pack:

| Component | Function | Module selection |
|---|---|---|
| ESP32 DevKit (WROOM-32) | Control, WiFi and Bluetooth | 2.4GHz WiFi network |
| **2×** MAX98357 | I2S amplification, one module per channel | Check supply, load and channel selection in the module's datasheet |
| **2×** speaker | Left and right output | Choose impedance and power ratings compatible with the amplifiers |
| 16×2 LCD + I2C adapter | Status, volume and title | Firmware address: 0x27 |
| LM2596S with display | Supply regulation | Set to 5.0V; capacity depends on the module and cooling |
| USB-C 2S charger and protection | Pack charging | Check cell compatibility and input requirements |
| **2×** 18650 in series | 2S battery | Verify the holder's series configuration |
| Resistors | VBAT divider and SD channel selection | Follow the wiring guide and validate voltages before connecting |

No measurements of power output, consumption or battery life have been published for the complete assembly.

## Assembly sequence

Test each stage before moving to the next:

1. **Power first:** charge the 2S pack, connect it to the LM2596 and **set the converter to 5.0V using a multimeter. Do not connect other modules until the output is stable.**
2. **ESP32:** converter OUT+ → VIN, OUT− → GND. Test a Blink sketch over USB.
3. **Amplifiers (×2):** Vin→5V, common GND, I2S bus (25/26/27) to both. Connect a 4–8Ω speaker directly to each amplifier output (filterless class D).
4. **LCD:** VCC→5V, GND, SDA=21 / SCL=22.
5. **Firmware:** `tests/test_basic.ino` should produce a tone; then upload `src/main.ino`.

## Test bench before assembly

To validate hardware, wiring and stability before final assembly, consult:

- `testbench/README.md`
- `testbench/PINOUT.md`
- `testbench/VALIDATION_PLAN.md`
- `testbench/CHECKLIST_PRE_MONTAJE.md`
- `testbench/firmware/` (smoke test, L/R and stereo stability)
- `testbench/results/logs/LOG_TEMPLATE.md`

**Before connecting the modules:** with power disconnected, check ground continuity and the absence of shorts. Separately verify that the regulator supplies 5.0V. Reference photos are in `pics/build/` and `pics/modules/`.

## Troubleshooting

- **Restarts when using WiFi:** check the supply, cables and serial monitor messages for possible voltage drops.
- **Noise:** check common ground, power and I2S wiring. Follow the module's decoupling recommendations.
- **Distortion:** try a lower volume and verify that the supply stays stable during playback.
- **Only one channel:** measure SD voltage on each amplifier and compare it with the datasheet.
- **WiFi does not connect:** check credentials and confirm that the network operates at 2.4GHz.

## Status

In development: functional prototype. The code includes WiFi radio, YouTube/Invidious, Bluetooth A2DP, Bluetooth serial configuration, LCD support and VBAT readings. A custom PCB is still planned.

## License

Check each dependency's license terms before redistribution. This directory does not include a license file of its own.

---

_HIOS — HI Open Systems · [openhios.dev/projects/speaker](https://openhios.dev/projects/speaker)_
