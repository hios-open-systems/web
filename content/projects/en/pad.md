# HIOS PAD — ESP32-S3 programmable control deck

Desktop controller with a screen, rotary encoder, joystick, 10 action keys and 2 ALT keys. It sends **keyboard, mouse and media actions over USB or Bluetooth BLE**. Layers organize controls by context. WiFi supports device configuration and communication with an optional companion that reports PC state.

## Getting started

```bash
cd projects/pad

# Build and upload with PlatformIO
pio run -t upload

# Serial monitor
pio device monitor -b 115200
```

At startup, the monitor displays `token API/OTA`. Copy it into `companion/config.json` before starting the daemon or opening the web app from another machine. The token is generated once, stored in NVS and used to authenticate the web API and OTA updates.

> **Uploading from WSL:** attach the DevKit serial interface (CH343, UART) to WSL. From Windows PowerShell, run `usbipd list`, then `usbipd attach --wsl --busid <id>`. Repeat after reconnecting the cable. The serial device can then appear as `/dev/ttyACM0`. The S3's **native USB** interface (303a:1001) handles HID; CH343 handles uploading and serial communication.

## Workflow

1. **Assembly:** follow **[/pinouts/pad](https://openhios.dev/pinouts/pad)** for module order, the assembly checklist and measurements: 5.0V regulator, amplifier SD pins and matrix diodes. The guide is checked against [`src/app/Pins.h`](src/app/Pins.h) and [`platformio.ini`](platformio.ini) by `npm run test:wiring` from the web repository root.
2. **First wired upload:** run `pio run -t upload`. For WSL, attach CH343 with `usbipd` first.
   > **Power:** with the 2S pack connected, open `SW-CELDAS` before connecting USB. Otherwise USB VBUS and the regulator output would be joined at the `5V` pin. Upload with battery power switched off, or use OTA.
3. **OTA updates:** once WiFi is available, add `--auth=<token API/OTA>` to `upload_flags` under `[env:ota]` in `platformio.ini`. Run `pio run -e ota -t upload --upload-port hiospad.local`. Keep native USB-C and BOOT accessible for recovery if an update fails.
4. **Optional companion:** start it to receive PC state and control system microphone mute. The PAD's HID controls work without it.

## Available features

Each **layer** assigns actions to the **10 action keys**, 2 ALT keys, encoder and joystick. USB and BLE send keyboard, mouse and media actions through HID. Shortcut compatibility depends on the operating system and application.

- **USB and BLE:** TinyUSB and NimBLE provide composite keyboard, mouse and consumer HID. Automatic switching selects USB when connected and BLE when disconnected. WiFi carries state and mediated control, not HID.
- **Independent use:** HID controls need neither a network nor the companion. PC state and system microphone mute require the companion and a network connection.
- **Joystick mouse:** moves the pointer; a tap sends a left click, a double tap a right click, and a long press toggles mouse mode.
- **Contextual encoder:** controls volume, scrolling, zoom or tabs according to the layer. Double-click cycles behaviors; pressing opens the menu.

## Layers and menu

Layers are grouped by type. Pressing the encoder opens a single-level selector: the **10 physical keys** select layers within the current group, and rotating the encoder changes groups.

| Group | Layers |
|---|---|
| **Work** | Editing, Dev, Apps |
| **Media** | Multimedia, YouTube, Netflix |
| **Web** | Browser |
| **Calls** | Meet, Slack, Zoom, Teams |
| **System** | RGB |
| **Settings** (last page) | Brightness, Theme, Color, Skin, Dimmer, Time, WiFi, Calibration |

Rotate to change group/page; keys 1–10 select a layer. Press the encoder to open settings; long-press to return or close.

### Video calls

Each app has a shortcut layer. A short press on microphone control sends its configured shortcut; a long press requests system microphone mute through the companion. The Slack layer uses this system control. Camera control uses the app's shortcut. Compatibility depends on the system, shortcut settings and permissions.

> In Zoom, enable global shortcuts under Settings → Keyboard Shortcuts to control mute without focusing the window.

## Optional companion software

The companion adds web editing and communication with the operating system. HID remains available when the companion is disconnected.

- **[`pad-companion`](companion): background service.** Reports volume and microphone state through `POST /api/state`, and receives PAD commands for the operating system. Windows and Linux are supported; macOS is pending. CPU/GPU and temperature metrics depend on available sensors, programs and permissions. If updates stop, the PAD returns to estimated state. See [`companion/README.md`](companion/README.md) for the API contract, dependencies and automatic startup.
- **Web admin and mirror:** the server in [`companion/src/web`](companion/src/web) edits mappings, layers and text. Its PAD mirror/emulator uses the firmware's data model and sends configuration without recompilation.
- **[`host/openrgb-rgb-layer.ahk`](host/openrgb-rgb-layer.ahk):** AutoHotkey helper connecting the PAD's RGB layer to **OpenRGB** on the PC to control peripheral lighting by active layer.

## Architecture

FreeRTOS tasks are assigned by core:

- **inputTask** (core1): reads buttons, encoder and joystick; `Dispatcher` resolves layer actions, queues them and prepares a UI snapshot.
- **transportTask** (core1): consumes actions and sends them over the active USB/BLE HID transport through `TransportRouter`.
- **uiTask** (core0): draws the dashboard, menu and portal with `TFT_eSprite`.
- **netTask** (core0): WiFi STA, captive portal, NTP and WebServer (`/api/state`).

Directories: `actions/` (`Action` model), `mapping/` (`KeyMap`/`Dispatcher`), `inputs/` (buttons, encoder, joystick), `transport/` (USB, BLE, router), `net/`, `ui/` (skins, menu, dock, vector icons), `storage/` (default configuration), and `app/` (configuration, pins, state).

## Hardware

- **ESP32-S3-DevKitC-1 N16R8:** 16MB flash and 8MB octal PSRAM, AP Memory 3.3V, identified in the project chip dump. Octal PSRAM uses GPIO 33–37 and flash uses 26–32; these pins are unavailable for peripherals.
- **4-inch ILI9488 display:** 480×320 SPI, HSPI at 27MHz. The project uses ILI9488, not ST7796.
- **KY-040 encoder**, **HW-504 joystick** powered at **3V3**, and **12 normally open buttons** to GND: 10 action buttons in a **2×5 diode matrix** with cathodes toward rows, plus 2 direct ALT buttons.
- **2× MAX98357A:** shared I2S bus; SD selects each channel. Project wiring: L with SD to Vin, R with SD through **390k** to Vin.
- Pin definitions: [`src/app/Pins.h`](src/app/Pins.h). Wiring and power sequence: **[/pinouts/pad](https://openhios.dev/pinouts/pad)**, checked against the firmware by self-tests.

## Implementation notes

- **Sprites and fonts:** call `setTextFont(1)` after creating each `TFT_eSprite`; the project records a startup loop caused by an uninitialized `gfxFont`.
- **Joystick at 3V3:** do not power it at 5V; its output can exceed the S3 ADC input range.
- **BLE symbol conflicts:** `USBHIDKeyboard.h` and BLE headers define conflicting `KEY_*`/`KeyReport` symbols. Factories in `transport/` isolate them so `main` does not include both headers.
- **Menu memory:** release the carousel sprite, approximately 60KB, when closing the menu to reduce heap pressure with BLE and WiFi active.
- **Voltage drops:** if the device restarts when WiFi or BLE activates, check power and serial logs before attributing the issue to firmware.

## Status

**Implemented:** automatic USB/BLE HID switching, WiFi, portal, NTP, joystick mouse, layers and menu, PC state and system microphone mute through the companion, **JSON configuration** via `GET/POST /api/config` in LittleFS, and a **display mirror** served by the companion over SSE. Configuration can be edited and sent without recompiling.

Battery measurement on the PAD is disabled: the supply display shows the 2S pack voltage, while GPIO9, previously assigned to the divider, now drives the NeoPixel. Keep `cfg::BATTERY_ENABLED=false` unless the ADC is reassigned. Do not connect the battery divider to the NeoPixel data line.

### Planned development

- [ ] **Direct PAD web interface: code implemented, hardware validation pending.** Served by the PAD through [`net/WebUi.cpp`](src/net/WebUi.cpp), without a PC. Includes state display, layer selection, a **virtual 2×5 PAD** for keys/encoder and a **configuration editor** for names, colors and labels that preserves actions. Endpoints: `GET /api/ui`, `POST /api/cmd` and `/api/config`. `npm run test:padwebui` tests the extracted firmware page with Playwright and a mocked API contract. Applying changes on the physical device still requires validation with the firmware uploaded.
- [ ] **Editable gestures:** adding configurable secondary gestures requires a redesign; the previous hardcoded long-press behavior was removed. Lower priority.
- [ ] **Pad2:** proposed new architecture with a virtual PAD first, data-driven behavior and JavaScript/JSDoc without a build step. Not started.

## Credits

The printed joystick knob is based on [this Thingiverse model](https://www.thingiverse.com/thing:6189483). Thanks to its creator for sharing it.
