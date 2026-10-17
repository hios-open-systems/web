# HIOS PAD — ESP32-S3 Programmable Control-Deck & Gaming Keypad

Open-hardware desktop controller built around the **ESP32-S3 N16R8**, a **4-inch ILI9488 TFT display (480×320)**, a rotary encoder, an analog thumb joystick, **10 action keys in a 2×5 diode matrix**, **2 `ALT` modifier keys**, **dual I2S stereo amplifiers (2× MAX98357A)**, and **8× WS2812B NeoPixels split into 2 independent zones**.

The exact same physical hardware supports **two firmware personalities**:
1. **Control-Deck Firmware (Productivity, Dev & PC Telemetry):** organizes shortcuts, multi-step macros, mouse pointer control, video-call actions, WiZ/OpenRGB lighting, and real-time PC hardware telemetry over USB/BLE + WiFi with `pad-companion`.
2. **Gaming Keypad / Gamepad Firmware (Gaming Edition):** turns the diode-isolated 2×5 key matrix (true N-Key Rollover without ghosting), 12-bit analog thumbstick, and `ALT` thumb/pinky keys into a low-latency one-handed gaming keypad and HID controller with per-game HUD profiles.

---

## 1. Physical Controls, Diode Matrix & Input Gestures

The input subsystem (`src/inputs/` and `src/mapping/`) runs on **Core 1** of FreeRTOS and normalizes all hardware peripherals into GPIO-independent `InputEvent` messages:

| Physical Control | Hardware / GPIO | Implemented Behavior & Gestures |
|---|---|---|
| **10 Action Keys (`BTN_1..10`)** | 2×5 matrix with `1N4148` diodes (cathode to row, `MTX_SETTLE_US = 30 µs`, `25 ms` debounce) | Trigger keyboard shortcuts (`kmod::CTRL/SHIFT/ALT/GUI`), media keys (`MediaUsage`), multi-step macros, text snippets, app launchers, or network commands to the companion. Every press emits a crisp I2S acoustic click (`2200 Hz`, `18 ms`). |
| **2 `ALT` Keys (`ALT_1`, `ALT_2`)** | Direct GPIO inputs to GND with `ALT_LINGER_MS = 600 ms` grace window | **Momentary layer shifts:** holding `ALT 1` opens the **Launcher** layer (spawns 6 PC apps via companion); holding `ALT 2` opens the **Macros** layer. The 600 ms linger window prevents false releases. |
| **Rotary Encoder (`KY-040`)** | A/B quadrature with dynamic acceleration (`ENC_ACCEL_MS = 35 ms`, `×4`, max 12 steps) + `ENC_SW` | **Rotate:** executes the active layer's rotary action (`Volume`, `Scroll`, `Zoom`, `Tabs`, or `Brightness`). **Double-tap (`220 ms`):** live-cycles the encoder override (`Layer → Volume → Scroll → Zoom → Tabs`) without leaving the current layer. **Single tap:** opens the group/layer carousel menu. **Long-press (`600 ms`):** opens Settings or goes back. |
| **Analog Joystick (`HW-504`)** | Powered at **3.3 V** on 12-bit ADC1 (`8 discard reads` + `4×` averaging) + `STICK_SW` | **X/Y Axes:** drives the HID mouse pointer at `40 Hz` with deadzone (`450`), slow EMA auto-recentering, and a **quadratic acceleration curve (`mouseAccel`)** for pixel-level center precision and fast screen traversal at full deflection. **Tap (`140 ms`):** left click. **Double-tap:** right click. **Long-press (`600 ms`):** toggles mouse mode. **Hold `ENC_SW + STICK_SW` (`1.5 s`):** interactive NVS calibration. |

---

## 2. Theme Engine, RGB565 Palette, Dual-Zone NeoPixels & Telemetry Monitors

The UI engine (`src/ui/` and `src/app/Theme.h`) renders over a **27 MHz HSPI** bus using localized partial updates so the display never flickers and the web server stays responsive:

* **Dark Mode (`MODE_DARK`) & Light Mode (`MODE_LIGHT`):** native 16-bit **RGB565** semantic tokens (`BG`, `PANEL`, `CARD`, `EDGE`, `FG`, `SOFT`, `DIM`, `DARK`) with runtime alpha blending (`theme::blend`) switchable directly on the device.
* **7 Global Accent Colors + Per-Layer Color Identity:** the `Color` setting selects among **7 global accents** (`Cyan`, `Green`, `Magenta`, `Orange`, `Violet`, `Rose`, `Yellow`) for the header wordmark and NTP clock, while each layer carries its own RGB565 accent color.
* **Dual-Zone WS2812B NeoPixel Lighting (`GPIO9`):** two chained 4-LED boards (**8 addressable pixels split into 2 zones**) illuminate the translucent 3D-printed enclosure with the active layer's color.
* **Partial Dirty-Check Rendering (`dash::*`):** compares consecutive `UiSnapshot` structs and redraws **only the changed region**: `dash::keycap()`, `dash::status()`, `dash::clock()`, `dash::encDial()`, or `dash::stick()`.
* **4 Full-Screen Telemetry Monitor Views (`src/ui/monitor.cpp`):** selecting a Monitor layer replaces the 10-key grid with dedicated instrumentation screens featuring **56-sample circular history buffers** and real-time **sparklines**:
  1. **General:** **CPU & GPU** temperatures (`°C`) and load (`%`) with thermal threshold coloring (`Green < 65 °C`, `Yellow ≥ 65 °C`, `Red ≥ 80 °C`), cooler fan speed (`RPM` or `%`), **RAM**, and **VRAM** usage (`MB used / total`).
  2. **Network (`Red`):** Auto-scaled **download and upload throughput** (`KB/s` or `MB/s`) with sparklines and local **IP address**.
  3. **Cores (`Núcleos`):** Individual per-core load bars for **up to 24 CPU threads**, system `uptime`, and active process count.
  4. **Disk (`Disco`):** Primary volume usage (`%`) and live **read/write throughput** (`KB/s` or `MB/s`) sparklines.
* **On-Device Settings Registry (`SettingsRegistry`):** grouped into **Appearance** (`Brightness` 8-bit LEDC PWM, `Theme` Dark/Light, `Color` accent) and **System** (`Time` NTP, `WiFi` STA/Captive Portal, `Calibrate` stick, `Precision` pointer speed, `Dimmer` idle timeout), persisted in **NVS**.

---

## 3. Built-in 16-Layer Catalog

Pressing the encoder opens a single-level group selector: rotate the encoder to switch groups and press any of the **10 physical keys** to jump to a layer:

| Group | Included Layers | Key Capabilities |
|---|---|---|
| **Work** | `Edición`, `Dev`, `Apps` *(+ `Launcher` on `ALT1` & `Macros` on `ALT2`)* | **Editing:** Copy, Paste, Cut, Undo, Redo, Select All, Find, Save, Replace, Email snippet, and Encoder Scroll. **Dev:** Terminal, Command Palette, Comment, Run (`F5`), `Build` macro (`Ctrl+\` + npm run build`), Go to File, Symbol, Format, Rename, and Encoder Zoom. **Apps:** `Win+1..4`, Show Desktop, Virtual Desktops, `Alt+Tab`, Maximize/Minimize. |
| **Media** | `Multimedia`, `YouTube`, `Netflix`, `Spotify`, `Disney+` | Global HID Consumer controls (`Play/Pause`, `Prev`, `Next`, `Mute`, `Stop`, `Volume`) plus web player layers with `±10 s` seek, fullscreen (`F`), captions (`C`), and playback speed (`Shift+<` / `Shift+>`). |
| **Web** | `Navegador` | Back, Forward, Reload, New Tab, Close Tab, Reopen Closed Tab (`Ctrl+Shift+T`), Bookmarks, Find, History, Incognito, and Encoder Tab Cycling (`Ctrl+PgUp/PgDn`). |
| **Calls** | `Meet`, `Slack`, `Zoom`, `Teams` | Mic, camera, raise hand, screen share, chat, record, and hang up. **Two-tier mic control:** a *short tap* sends the app shortcut; a *long press* triggers **OS-level global microphone mute** via `pad-companion` (Core Audio on Windows / PipeWire on Linux). |
| **System & Smart Home** | `RGB`, `WiZ` | **RGB:** sends `Ctrl+Alt+Shift+Key` combos to `host/openrgb-rgb-layer.ahk` to control **OpenRGB** PC lighting. **WiZ:** controls WiZ smart lights over local UDP via the companion (On/Off, room cycle, warm/cool temperature, light target, and rotary brightness with live status in the PAD header). |
| **Monitor (Telemetry)** | `General`, `Red`, `Núcleos`, `Disco` | Full-screen hardware instrumentation fed by `pad-companion` with a `LIVE` status badge (automatically falls back to `sin PC` after 5 s offline). |

---

## 4. Companion Daemon (`pad-companion`), Web Editor, Live Mirror & Embedded PWA

HID controls work **standalone without any PC software**. Adding `pad-companion` unlocks OS-level integration and live web configuration without recompiling:

1. **[`pad-companion`](companion) Headless Daemon (Windows & Linux, zero native addons):**
   * Polls system volume, mic mute state, CPU/GPU temperatures, fan speeds, per-core load, RAM/VRAM, network throughput, and disk I/O, pushing `POST /api/state` authenticated with `X-Pad-Token`.
   * Executes bidirectional commands returned by the PAD (`micToggle`, `launch`, `wiz*`).
2. **Web Admin & Live SSE Mirror (`companion/src/web`, port `8787`):**
   * **Live Mirror (`http://localhost:8787`):** renders a real-time replica of the PAD screen in the browser over Server-Sent Events (**SSE**).
   * **Configuration Editor (`http://localhost:8787/admin.html`):** edits layers, labels, colors, multi-step macros, text snippets, `ALT` targets, and **per-OS shortcut variants (Windows / Linux)**, pushing JSON directly to **LittleFS** (`POST /api/config`) without recompiling firmware.
3. **Embedded Direct Web UI ([`src/net/WebUi.cpp`](src/net/WebUi.cpp)):**
   * Served directly from ESP32-S3 `PROGMEM` at `http://hiospad.local` with no PC required: includes a **virtual 2×5 keypad + encoder** (`POST /api/cmd`) and an on-device layer/label/color editor.

---

## 5. Gaming Edition: Gamepad / Gaming Keypad Firmware (Same Hardware)

Because the HIOS PAD hardware combines a **diode-isolated 2×5 key matrix**, **2 thumb/pinky `ALT` buttons**, a **12-bit analog thumbstick**, a **rotary encoder**, **native USB TinyUSB**, and **dual I2S amplifiers**, the exact same physical build supports a **Gaming Keypad & HID Gamepad firmware profile**:

* **True N-Key Rollover (Anti-Ghosting):** `1N4148` diodes on every matrix switch plus direct `ALT` GPIOs allow simultaneous multi-key chords (diagonal movement + sprint + jump + reload/ability) with zero ghosting.
* **Dual Thumbstick Modes (360° Analog Axis or 8-Way D-Pad / WASD):**
  * **Analog Axis Mode (HID Gamepad):** outputs calibrated 16-bit X/Y analog axes using the NVS deadzone and response curve, freeing four fingers from `WASD`.
  * **Directional / Dual-Stage Mode:** maps tilt angle to walk vs. sprint thresholds.
* **Genre-Specific Profiles & 480×320 HUD:** dedicated layers for **FPS / Shooters**, **MOBA / ARPG**, **Flight & Racing Simulators (Button Box)**, and **Retro / Arcade**, with on-screen profile HUD, cooldown timers, I2S audio cues, and reactive NeoPixel zones.

---

## 6. Getting Started, Wiring & Flashing

```bash
cd projects/pad
pio run -t upload
pio device monitor -b 115200
```

* **Verified Wiring Guide:** follow **[/pinouts/pad](/pinouts/pad)** for step-by-step assembly, 2S power safety (`SW-CELDAS`), I2S stereo channel selection (`390 kΩ` on R channel `SD`), and GPIO assignments verified by `npm run test:wiring`.
* **3D Printable Enclosure & Knob:** inspect and download the STL files in **[Maker (/prints#prints-pad)](/prints#prints-pad)**.
