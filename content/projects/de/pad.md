# HIOS PAD — Programmierbares Control-Deck & Gaming-Keypad (ESP32-S3)

Open-Hardware-Tischcontroller auf Basis des **ESP32-S3 N16R8** mit **4-Zoll-ILI9488-TFT-Display (480×320)**, Drehencoder, analogem Daumen-Joystick, **10 Aktionstasten in einer 2×5-Diodenmatrix**, **2 `ALT`-Tasten**, **I2S-Stereo-Audio (2× MAX98357A)** und **8× WS2812B-NeoPixeln in 2 Zonen**.

Dieselbe physische Hardware unterstützt **zwei Firmware-Profile**:
1. **Control-Deck-Firmware (Produktivität, Dev & PC-Telemetrie):** organisiert Shortcuts, mehrstufige Makros, Maussteuerung, Videokonferenzen, WiZ/OpenRGB-Beleuchtung und Echtzeit-Systemmonitore über USB/BLE + WiFi mit `pad-companion`.
2. **Gaming-Keypad / Gamepad-Firmware (Spiele-Edition):** nutzt die entkoppelte 2×5-Diodenmatrix (echtes N-Key-Rollover ohne Ghosting), den 12-Bit-Analogstick und die `ALT`-Tasten als Einhand-Gaming-Keypad und HID-Gamepad mit Profil-HUD auf dem Display.

---

## 1. Bedienelemente, Diodenmatrix & Gesten

| Bedienelement | Hardware / GPIO | Funktion & Gesten |
|---|---|---|
| **10 Aktionstasten (`BTN_1..10`)** | 2×5-Matrix mit `1N4148`-Dioden (`30 µs` Settle, `25 ms` Entprellung) | Tastenkürzel, Mediensteuerung, Makros, Textbausteine, App-Launcher und Companion-Befehle mit akustischem I2S-Tastenklick (`2200 Hz`, `18 ms`). |
| **2 `ALT`-Tasten (`ALT_1`, `ALT_2`)** | Direkte GPIOs mit `600 ms` Haltefenster (`ALT_LINGER_MS`) | **Momentane Ebenen:** `ALT 1` öffnet **Launcher** (startet 6 PC-Apps), `ALT 2` öffnet **Macros**. |
| **Drehencoder (`KY-040`)** | Dynamische Beschleunigung (`35 ms`, `×4`) + Taster `ENC_SW` | **Drehen:** Ebenen-Aktion (`Lautstärke`, `Scroll`, `Zoom`, `Tabs`, `Helligkeit`). **Doppeltipp:** wechselt den Encoder-Modus live. **Kurzer Druck:** Gruppen-/Ebenenmenü. **Langer Druck:** Einstellungen / Zurück. |
| **Analog-Joystick (`HW-504`)** | **3,3 V** am 12-Bit-ADC1 + Taster `STICK_SW` | **X/Y-Achsen:** HID-Mauszeiger (`40 Hz`) mit quadratischer Beschleunigung (`mouseAccel`) und EMA-Zentrierung. **Tipp:** Linksklick. **Doppeltipp:** Rechtsklick. **Halten:** Mausmodus ein/aus. **`ENC_SW + STICK_SW` (`1,5 s`):** NVS-Kalibrierung. |

---

## 2. Theme-System (RGB565), Dual-Zone-NeoPixel & 4 Telemetrie-Monitore

* **Dark Mode (`MODE_DARK`) & Light Mode (`MODE_LIGHT`):** native 16-Bit-RGB565-Farbpalette mit **7 globalen Akzentfarben** (`Cyan`, `Green`, `Magenta`, `Orange`, `Violet`, `Rose`, `Yellow`) sowie eigener Kennfarbe pro Ebene.
* **Dual-Zone-WS2812B-NeoPixel (`GPIO9`):** 8 adressierbare LEDs in 2 Zonen beleuchten das Gehäuse passend zur aktiven Ebene.
* **Partielles Dirty-Check-Rendering (`dash::*`):** aktualisiert über den 27-MHz-SPI-Bus nur veränderte Kacheln ohne Bildschirmflackern.
* **4 Vollbild-Telemetrieansichten (`src/ui/monitor.cpp`):** **General** (CPU/GPU-Temperatur und -Last mit 56-Sample-Sparklines, Lüfter-RPM, RAM, VRAM), **Red** (Download/Upload in `KB/s` oder `MB/s` + IP), **Núcleos** (Einzelkernlast für bis zu 24 Threads, Uptime, Prozesse) und **Disco** (Volumenbelegung und Lese-/Schreib-Sparklines).

---

## 3. 16 vorkonfigurierte Ebenen & Companion-Ökosystem

* **Arbeit (`Edición`, `Dev`, `Apps`, `Launcher`, `Macros`)**, **Medien (`Multimedia`, `YouTube`, `Netflix`, `Spotify`, `Disney+`)**, **Web (`Navegador`)**, **Anrufe (`Meet`, `Slack`, `Zoom`, `Teams` mit App-Shortcut bei kurzem Tipp und globalem OS-Mikrofon-Mute bei langem Druck)**, **System (`RGB` OpenRGB, `WiZ` Smart-Lights per UDP)** und **Monitor (`General`, `Red`, `Núcleos`, `Disco`)**.
* **[`pad-companion`](companion) + Web-Editor & Live-Mirror (`localhost:8787`):** Hintergrunddienst für Windows und Linux (`POST /api/state`), Echtzeit-SSE-Bildschirmspiegel und Web-Editor (`/admin.html`) für Layouts, Makros und Windows/Linux-Varianten (speichert direkt in LittleFS über `POST /api/config` ohne Neukompilierung).
* **Direkte Web-UI auf dem ESP32-S3 (`http://hiospad.local`):** in `PROGMEM` eingebettete PWA mit virtuellem 2×5-Pad und Schnell-Editor.

---

## 4. Gaming-Edition: Gamepad / Gaming-Keypad-Firmware (Gleiche Hardware)

* **Echtes N-Key-Rollover ohne Ghosting** durch die `1N4148`-Diodenmatrix.
* **360°-Analogstick oder 8-Wege-WASD/D-Pad** am Daumen mit NVS-Kalibrierung.
* **Spielprofile & 480×320-HUD** für **FPS/Shooter**, **MOBA/ARPG**, **Flug-/Rennsimulatoren (Button-Box)** und **Retro-Gaming** inklusive I2S-Audio-Feedback und NeoPixel-Profilfarben.

---

## 5. Aufbau, Verdrahtung & Flashen

```bash
cd projects/pad
pio run -t upload
pio device monitor -b 115200
```

* **Verifizierte Verdrahtungsanleitung:** **[/pinouts/pad](/pinouts/pad)** (automatisch geprüft gegen `Pins.h` und `platformio.ini` per `npm run test:wiring`).
* **3D-Druckteile (STL):** im Bereich **[Maker (/prints#prints-pad)](/prints#prints-pad)**.
