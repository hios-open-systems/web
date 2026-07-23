# HIOS PAD — Macropad / Control-Deck ESP32-S3

Macropad de escritorio con pantalla a color, encoder, joystick analógico, 10 teclas de acción (+ 2 ALT) y 2 parlantes, que actúa como **teclado/mouse/multimedia HID** por **USB, Bluetooth (BLE) y WiFi**. Capas por contexto (edición, dev, multimedia, navegador, videollamadas) navegables desde la propia pantalla, con feedback real del estado de la PC vía un daemon companion.

## Quick Start

```bash
cd projects/pad

# Compilar y flashear (PlatformIO)
pio run -t upload

# Monitor serial
pio device monitor -b 115200
```

Al arrancar, el monitor muestra `token API/OTA`. Copialo en
`companion/config.json` antes de iniciar el daemon o abrir la PWA desde otra
máquina. El token se genera una única vez, queda guardado en NVS y protege la
API web y OTA.

> **Flasheo en WSL:** el puerto serie del DevKit (CH343, UART) no aparece solo en WSL. Desde PowerShell (Windows): `usbipd list` → `usbipd attach --wsl --busid <id>` (al reconectar el cable hay que re-attachear). Recién ahí aparece `/dev/ttyACM0`. El USB **nativo** del S3 (303a:1001) es el HID; el CH343 es para flashear/serial.

## Flujo de trabajo

Del cero a la placa andando:

1. **Soldar** — seguí la guía verificada **[/pinouts/pad](https://openhios.dev/pinouts/pad)**: ordena los módulos por paso, trae el checklist de armado y las mediciones (buck a 5.0V, SD de los amplis, diodos de la matriz). Es la **única** hoja de cableado y se auto-verifica contra [`src/app/Pins.h`](src/app/Pins.h) + [`platformio.ini`](platformio.ini) en cada `npm run test:wiring` (desde la raíz del repo web).
2. **Primer flasheo (por cable)** — `pio run -t upload` (ver *Quick Start*). En WSL, attachá el CH343 con `usbipd` primero.
   > ⚠️ **Eléctrico:** con el pack 2S conectado, **no enchufes el USB sin abrir antes `SW-CELDAS`** — el VBUS del USB y la salida del buck pelearían en el pin `5V`. Flasheá con el pack apagado, o subí por OTA sin tocar cables.
3. **Updates (OTA)** — ya con WiFi: en `platformio.ini`, agregá
   `--auth=<token API/OTA>` a `upload_flags` de `[env:ota]`, luego ejecutá
   `pio run -e ota -t upload --upload-port hiospad.local`. El USB-C nativo + el
   botón BOOT quedan accesibles por si un OTA sale mal.
4. **Companion (opcional)** — arrancá el daemon para feedback real y mute global (ver *Apps companion*). El pad es **local-first**: anda perfecto sin nada de esto.

## ¿Qué es?

Un control-deck que reemplaza atajos y controles dispersos por **capas** físicas. Cada capa mapea las **10 teclas de acción** + los 2 ALT + encoder + stick a acciones (atajos de teclado, multimedia, mouse, macros). Es **HID nativo** (la PC lo ve como teclado/mouse), así que funciona sin drivers.

- **Multi-transporte:** USB (TinyUSB) y BLE (NimBLE, HID compuesto teclado+mouse+consumer) en simultáneo; auto-switch (enchufado → USB, desenchufado → BLE). WiFi para feedback/control mediado (no es HID).
- **Local-first:** todo funciona sin red ni companion. El WiFi y el daemon son una capa opcional que **mejora** (feedback real, mute global), nunca bloquea.
- **Stick como mouse:** el joystick mueve el puntero; tap = click izq, doble = click der, long = toggle modo mouse.
- **Encoder contextual:** gira según la capa (volumen/scroll/zoom/pestañas); doble-click cicla entre comportamientos; press abre el menú.

## Capas y menú

Las capas se agrupan por tipo. El menú (encoder-press) es un **picker de un nivel**: muestra las capas del grupo sobre las **10 teclas físicas** y girás el encoder para pasar de grupo. Apretás un botón → saltás a esa capa.

| Grupo | Capas |
|-------|-------|
| **Trabajo** | Edición, Dev, Apps |
| **Multimedia** | Multimedia, YouTube, Netflix |
| **Web** | Navegador |
| **Llamadas** | Meet, Slack, Zoom, Teams |
| **Sistema** | RGB |
| **Ajustes** *(página final)* | Brillo, Tema, Color, Skin, Dimmer, Hora, WiFi, Calibrar |

- **Girar** = cambiar de grupo/página · **Teclas 1-10** = saltar a la capa · **Encoder-press** = abrir Ajustes · **Long-press** = volver/cerrar.

### Videollamadas (grupo Llamadas)

Una capa por app con sus atajos. El **mic** tiene doble vía: **tap** = atajo de la app (Meet `Ctrl+D`, Zoom `Alt+A`, Teams `Ctrl+Shift+M`); **hold** (long-press) = **mute global** a nivel OS vía companion (Core Audio), que funciona en cualquier app y refleja el estado real. Slack no tiene atajo de mic → usa el mute global. La cámara va por atajo de la app.

> Zoom requiere activar *global shortcuts* (Settings → Keyboard Shortcuts) para mutear sin foco en la ventana.

## Apps companion (opcionales)

Todo esto es **local-first**: el pad funciona solo. Las apps lo *potencian*; si se caen, el pad sigue.

- **[`pad-companion`](companion) — daemon (headless).** Lee el estado real de la PC (volumen, mic muteado, temps y carga de CPU/GPU en Windows Core Audio / Linux PipeWire) y lo empuja por `POST /api/state`: el display pasa de estado **optimista** (lo que el pad cree haber dejado) a datos reales. El mismo canal lleva comandos **pad→OS** en la respuesta del POST — el más usado es el **mute global de mic** a nivel sistema, que funciona en cualquier app (Slack, Meet, etc.). Si el daemon se cae, el pad vuelve al estado optimista en ~4s. Contrato de la API, dependencias por OS y autostart (systemd en Linux / Tarea Programada en Windows) en [`companion/README.md`](companion/README.md).
- **Admin + mirror — web (dentro del companion).** Servidor liviano ([`companion/src/web`](companion/src/web)) con UI para editar mapeos/capas/textos y un **mirror/emulador** del pad: editás el mismo modelo de datos que corre el firmware y se lo mandás, sin recompilar.
- **[`host/openrgb-rgb-layer.ahk`](host/openrgb-rgb-layer.ahk) — helper.** Script AutoHotkey que enlaza la capa RGB del pad con **OpenRGB** en la PC (ilumina periféricos según la capa activa).

## Arquitectura

FreeRTOS, tareas separadas por core:

- **inputTask** (core1): lee botones/encoder/stick → `Dispatcher` resuelve la acción de la capa → cola de acciones; arma el snapshot de UI.
- **transportTask** (core1): consume acciones → transporte HID activo (USB/BLE) vía `TransportRouter`.
- **uiTask** (core0): dibuja dashboard/menu/portal con `TFT_eSprite` (sin parpadeo).
- **netTask** (core0): WiFi STA + portal cautivo + NTP + WebServer (`/api/state`).

Directorios: `actions/` (modelo de `Action`), `mapping/` (`KeyMap`/`Dispatcher`), `inputs/` (botones/encoder/stick), `transport/` (USB/BLE/router), `net/`, `ui/` (skins, menu, dock, iconos vectoriales), `storage/` (config por defecto), `app/` (config, pines, estado).

## Hardware

- **ESP32-S3-DevKitC-1** (**N16R8**: 16MB flash + 8MB PSRAM octal, AP Memory 3.3V — confirmado por chip dump). La PSRAM octal ocupa los GPIO 33–37 (y la flash los 26–32): no están disponibles.
- **Display ILI9488 4"** 480×320 SPI (HSPI, 27MHz). *No es ST7796.*
- **Encoder** KY-040 · **Joystick** HW-504 (alimentado a **3V3**, no 5V) · **12 pulsadores** NA a GND: 10 de acción en **matriz 2×5 con diodos** (cátodo hacia la fila) + 2 ALT directos.
- **2× MAX98357A** (I2S, bus compartido; el canal lo elige el pin SD de cada uno: L = SD a Vin, R = SD por **390k** a Vin).
- Pines en [`src/app/Pins.h`](src/app/Pins.h) (fuente de verdad). **Cableado y alimentación paso a paso: la guía [/pinouts/pad](https://openhios.dev/pinouts/pad)**, verificada contra el firmware por self-test.

## Gotchas (aprendidos a los golpes)

- **Sprite + fuente:** `new TFT_eSprite` deja `gfxFont` sin inicializar → boot loop. Llamar `setTextFont(1)` tras crear cada sprite.
- **Joystick a 3V3:** a 5V sobre-voltea el ADC del S3 y acopla los ejes (diagonales fantasma). El stick va a 3V3.
- **BLE symbol clash:** `USBHIDKeyboard.h` y las libs BLE chocan (`KEY_*`/`KeyReport`); se aíslan con fábricas (`transport/`), `main` nunca ve ambos headers.
- **Heap del menú:** el sprite del carrusel (~60KB) se libera al cerrar el menú; si queda alocado, el heap steady-state (con BLE+WiFi) se agota.
- **Brownout:** un cable USB fino / fuente floja tira la tensión en los picos de corriente (WiFi+BLE) → boot loop. No es software.

## Estado

**Funcionando:** USB + BLE HID (auto-switch), WiFi + portal + NTP, stick→mouse, capas + menú, feedback real y mute global por companion, **config editable por JSON** (`GET/POST /api/config` en LittleFS, se edita y empuja desde el companion sin recompilar) y **espejo de pantalla** (el companion sirve un mirror live del display por SSE).

La medición de batería en el pad se **descartó**: la pantalla de la fuente ya muestra la tensión del pack 2S, y GPIO9 (ex-divisor) hoy maneja el NeoPixel — `cfg::BATTERY_ENABLED=false` y **no reactivar** sin reasignar el ADC (si no, le metés 2.7V DC a la línea de datos del NeoPixel).

### Roadmap

- [x] **PWA directa al pad** — servida por el propio pad ([`net/WebUi.cpp`](src/net/WebUi.cpp), sin PC): ver estado live, saltar de capa, **pad virtual 2×5** que dispara las teclas/encoder, y **editor de config** (nombre/color/labels, preservando acciones). Endpoints `GET /api/ui` + `POST /api/cmd` + `/api/config`. Frontend verificado headless por **`npm run test:padwebui`** (Playwright + mock del contrato, extrae la página real del firmware). *Falta confirmar el apply on-device (flasheo pendiente).*
- [ ] **Gestures editables** — el long-press hardcodeado se quitó a propósito; re-agregar acciones secundarias como gestos *editables* (no hardcode) es rediseño, despriorizado.
- [ ] **Pad2 (reinicio limpio)** — bifurcación mayor: pad virtual primero, data-driven, stack JS+JSDoc zero-build. Pensado, sin arrancar.

## Créditos

La perilla impresa del joystick analógico sale de [este modelo en Thingiverse](https://www.thingiverse.com/thing:6189483). Gracias a su autor por publicarlo.
