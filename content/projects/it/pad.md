# HIOS PAD — Control-Deck & Gaming Keypad Programmabile (ESP32-S3)

Controller da scrivania open-hardware basato su **ESP32-S3 N16R8**, display **TFT 4" ILI9488 (480×320)**, encoder rotativo, joystick analogico per pollice, **10 tasti di azione in matrice 2×5 con diodi**, **2 tasti `ALT`**, **audio stereo I2S (2× MAX98357A)** e illuminazione **NeoPixel a 8 LED su 2 zone**.

Lo stesso hardware fisico supporta **due personalità firmware**:
1. **Firmware Control-Deck (Produttività, Dev e Telemetria PC):** organizza scorciatoie, macro multi-step, puntatore mouse, chiamate, domotica WiZ/OpenRGB e monitoraggio hardware in tempo reale via USB/BLE + WiFi con `pad-companion`.
2. **Firmware Gaming Keypad / Gamepad (Edizione Gaming):** trasforma la matrice 2×5 con diodi (vero N-Key Rollover senza ghosting), lo stick analogico a 12 bit e i tasti `ALT` in un keypad da gioco a una mano e controller HID a bassa latenza con HUD dei profili su schermo.

---

## 1. Controlli fisici, matrice diodi e gesti di input

| Controllo fisico | Hardware / GPIO | Comportamento e gesti implementati |
|---|---|---|
| **10 Tasti di Azione (`BTN_1..10`)** | Matrice 2×5 con diodi `1N4148` (`30 µs` settle, `25 ms` debounce) | Scorciatoie da tastiera, controlli multimediali, macro multi-step, testi rapidi, avvio app o comandi al companion con click acustico I2S (`2200 Hz`, `18 ms`). |
| **2 Tasti `ALT` (`ALT_1`, `ALT_2`)** | GPIO diretti a GND con finestra `ALT_LINGER_MS = 600 ms` | **Livelli momentanei:** tenere premuto `ALT 1` apre **Launcher** (avvia 6 app su PC); tenere premuto `ALT 2` apre **Macros**. |
| **Encoder Rotativo (`KY-040`)** | Accelerazione dinamica (`35 ms`, `×4`) + pulsante `ENC_SW` | **Rotazione:** azione del livello (`Volume`, `Scroll`, `Zoom`, `Schede`, `Luminosità`). **Doppio tap:** cambia modalità encoder al volo. **Tap singolo:** menu carosello gruppi/livelli. **Pressione prolungata:** livello successivo; nel menu, lo chiude. |
| **Joystick Analogico (`HW-504`)** | Alimentato a **3,3 V** su ADC1 a 12 bit + `STICK_SW` | **Assi X/Y:** muove il puntatore mouse a `40 Hz` con curva di accelerazione quadratica (`mouseAccel`) e auto-centratura EMA. **Tap:** clic sinistro. **Doppio tap:** clic destro. **Pressione prolungata:** attiva/disattiva mouse. **`ENC_SW + STICK_SW` (`1,5 s`):** calibrazione NVS. |

---

## 2. Sistema di Temi (RGB565), NeoPixel B-Zone e 4 Viste Monitor

* **Tema Scuro (`MODE_DARK`) e Tema Chiaro (`MODE_LIGHT`):** palette nativa RGB565 a 16 bit con **7 colori di accento globali** (`Cyan`, `Green`, `Magenta`, `Orange`, `Violet`, `Rose`, `Yellow`) più colore dedicato per ogni livello.
* **Illuminazione NeoPixel WS2812B a 2 Zone (`GPIO38`):** 8 LED indirizzabili divisi in 2 zone che sincronizzano la scocca traslucida con il colore del livello attivo.
* **Rendering Parziale Dirty-Check (`dash::*`):** ridisegna via SPI a 27 MHz solo le celle modificate senza sfarfallio.
* **4 Viste Telemetria / Monitor a Schermo Intero (`src/ui/monitor.cpp`):** **General** (temperatura e carico CPU/GPU con sparkline a 56 campioni, RPM ventole, RAM e VRAM), **Red** (download/upload in `KB/s` o `MB/s` + IP), **Núcleos** (barre di carico fino a 24 core, uptime e processi) e **Disco** (utilizzo volume e sparkline lettura/scrittura).

---

## 3. Catalogo di 16 Livelli Preconfigurati e Companion

* **Lavoro (`Edición`, `Dev`, `Apps`, `Launcher`, `Macros`)**, **Multimedia (`Multimedia`, `YouTube`, `Netflix`, `Spotify`, `Disney+`)**, **Web (`Navegador`)**, **Chiamate (`Meet`, `Slack`, `Zoom`, `Teams` con tap = scorciatoia app e pressione prolungata = mute globale OS)**, **Sistema (`RGB` OpenRGB, `WiZ` luci smart via UDP)** e **Monitor (`General`, `Red`, `Núcleos`, `Disco`)**.
* **[`pad-companion`](companion) + Editor Web & Live Mirror (`localhost:8787`):** demone per Windows e Linux (`POST /api/state`), specchio schermo SSE in tempo reale ed editor web (`/admin.html`) con salvataggio diretto su LittleFS (`POST /api/config`) senza ricompilare.
* **Interfaccia Web Diretta su ESP32-S3 (`http://hiospad.local`):** PWA servita da `PROGMEM` con pad virtuale 2×5 ed editor rapido.

---

## 4. Edizione Gaming: Firmware Gamepad / Gaming Keypad (Stesso Hardware)

* **Vero N-Key Rollover senza Ghosting** grazie ai diodi `1N4148` sulla matrice 2×5.
* **Stick analogico a 360° o D-Pad / WASD a 8 direzioni** per il pollice con calibrazione in NVS.
* **Profili per genere e HUD 480×320** per **FPS / Shooter**, **MOBA / ARPG**, **Simulatori di volo/guida (Button Box)** e **Retro Gaming**, con feedback acustico I2S e zone NeoPixel reattive.

---

## 5. Montaggio, Cablaggio e Programmazione

```bash
cd projects/pad
pio run -t upload
pio device monitor -b 115200
```

* **Guida al cablaggio verificata:** **[/pinouts/pad](/pinouts/pad)** (verificata automaticamente rispetto a `Pins.h` e `platformio.ini` con `npm run test:wiring`).
* **Parti stampabili in 3D (STL):** disponibili nella sezione **[Maker (/prints#prints-pad)](/prints#prints-pad)**.
