# HIOS PAD — Control-Deck & Gaming Keypad Programable (ESP32-S3)

> **Esquema de cableado, netlist y BOM (CSV):** [`hardware/`](hardware/). Se generan desde los datos verificados contra el firmware.

Plataforma de control de escritorio de hardware abierto basada en **ESP32-S3 N16R8**, pantalla **TFT 4" ILI9488 (480×320)**, encoder rotativo, joystick analógico de pulgar, **10 teclas de acción en matriz 2×5 con diodos**, **2 teclas `ALT`**, **audio estéreo I2S (2× MAX98357A)** e iluminación **NeoPixel de 8 LEDs en 2 zonas**.

El mismo hardware físico admite **dos personalidades de firmware**:
1. **Firmware Control-Deck (Productividad, Desarrollo y Telemetría):** organiza atajos, macros, puntero de mouse, llamadas, domótica WiZ/OpenRGB y monitoreo de hardware en tiempo real por USB/BLE + WiFi con `pad-companion`.
2. **Firmware Gaming Keypad / Gamepad (Modo Juegos):** transforma la matriz con diodos (N-Key Rollover real sin ghosting), el stick analógico de 12 bits y los botones `ALT` en un keypad de una mano y controlador HID de baja latencia con perfiles por juego en pantalla.

---

## 1. Controles físicos, matriz y gestos de entrada

El subsistema de entrada (`src/inputs/` y `src/mapping/`) corre a alta prioridad en el **Core 1** de FreeRTOS y normaliza todos los periféricos en eventos `InputEvent` desacoplados del GPIO físico:

| Control físico | Hardware / GPIO | Comportamiento y gestos implementados |
|---|---|---|
| **10 Teclas de Acción (`BTN_1..10`)** | Matriz 2×5 con diodos `1N4148` (cátodo a fila, `MTX_SETTLE_US = 30 µs`, antirrebote `25 ms`) | Disparan atajos de teclado (`kmod::CTRL/SHIFT/ALT/GUI`), teclas multimedia (`MediaUsage`), secuencias de macro multi-paso, inserción de texto, lanzamiento de apps o comandos de red al companion. Cada pulsación emite un click táctil acústico sintetizado por I2S (`2200 Hz`, `18 ms`). |
| **2 Teclas `ALT` (`ALT_1`, `ALT_2`)** | GPIO directos a GND con ventana `ALT_LINGER_MS = 600 ms` | **Capas momentáneas rápidas:** mantener `ALT 1` abre la capa **Launcher** (lanzador de 6 aplicaciones en PC vía companion); mantener `ALT 2` abre la capa **Macros** (ejecución de secuencias programables). La ventana de 600 ms evita cierres falsos al soltar. |
| **Encoder Rotativo (`KY-040`)** | Canal A/B con aceleración dinámica (`ENC_ACCEL_MS = 35 ms`, `×4`, tope 12 pasos) + pulsador `ENC_SW` | **Giro:** ejecuta la acción de la capa activa (`Volumen`, `Scroll`, `Zoom`, `Pestañas` o `Brillo`). **Doble-tap (`220 ms`):** cicla en vivo el override del encoder (`Capa → Volumen → Scroll → Zoom → Pestañas`) sin cambiar de capa. **Tap simple:** abre el menú. **Long-press (`600 ms`):** pasa a la capa siguiente; dentro del menú, lo cierra. |
| **Joystick Analógico (`HW-504`)** | Alimentado a **3.3 V** en ADC1 de 12 bits (`8 lecturas` de descarte S/H + promedio `4×`) + `STICK_SW` | **Ejes X/Y:** mueve el puntero del mouse a `40 Hz` con zona muerta (`450` sin calibrar; tras calibrar, la medida por eje), auto-recentrado lento EMA y **curva de aceleración cuadrática (`mouseAccel`)** para precisión fina en el centro y desplazamiento rápido en los extremos. **Tap (`140 ms`):** click izquierdo. **Doble-tap:** click derecho. **Long-press (`600 ms`):** activa/desactiva modo mouse. **Combo `ENC_SW + STICK_SW` (`1.5 s`):** calibración interactiva guardada en NVS. |

---

## 2. Sistema de Themes, Paleta RGB565, NeoPixel B-Zone y Vistas de Monitor

La interfaz gráfica (`src/ui/` y `src/app/Theme.h`) refresca cada ~50 ms sobre bus SPI a **27 MHz** sin bloquear el servidor web ni generar parpadeos de pantalla completa:

* **Modo Oscuro (`MODE_DARK`) y Modo Claro (`MODE_LIGHT`):** paleta semántica en formato nativo **RGB565 de 16 bits** (`BG`, `PANEL`, `CARD`, `EDGE`, `FG`, `SOFT`, `DIM`, `DARK`) con mezcla alfa por hardware/software (`theme::blend`) configurable en vivo desde el propio PAD.
* **7 Colores de Acento Globales + Color por Capa:** el ajuste `Color` permite elegir entre **7 acentos globales** (`Cyan`, `Green`, `Magenta`, `Orange`, `Violet`, `Rose`, `Yellow`) que tiñen la marca, el reloj NTP y los indicadores del header, mientras que cada capa define su propio color de identidad para la franja superior y los bordes activos.
* **Iluminación NeoPixel WS2812B en 2 Zonas (`GPIO9`):** 2 placas encadenadas de 4 LEDs (**8 píxeles direccionables divididos en 2 zonas independientes**) que sincronizan automáticamente el color de la carcasa translúcida con el color de la capa activa o las alertas de estado.
* **Renderizado Parcial por Dirty-Checking (`dash::*`):** en lugar de refrescar los `480×320` píxeles en cada ciclo, el motor compara el `UiSnapshot` actual con el anterior y redibuja **únicamente la celda modificada**: `dash::keycap()` (una sola tecla pulsada), `dash::status()` (cluster de batería, WiFi/BLE/USB y micrófono), `dash::clock()` (cambio de minuto), `dash::encDial()` (rueda del encoder) o `dash::stick()` (vector del joystick).
* **4 Vistas de Telemetría / Monitor a Pantalla Completa (`src/ui/monitor.cpp`):** cuando seleccionás una capa del grupo Monitor, el PAD reemplaza la grilla de teclas por instrumentos dedicados con historial circular de **56 muestras** y gráficos **sparkline** en tiempo real:
  1. **General:** Temperatura (`°C`) y porcentaje de carga de **CPU y GPU** con sparklines coloreados por umbral térmico (`Verde < 65 °C`, `Amarillo ≥ 65 °C`, `Rojo ≥ 80 °C`), velocidad de ventiladores (`RPM` o `%`), uso de **RAM** y **VRAM** (`MB usados / totales`).
  2. **Red:** Tasa de transferencia de **bajada y subida** auto-escalada (`KB/s` o `MB/s`) con sparkline histórico, estado de enlace e **IP local**.
  3. **Núcleos:** Barras individuales de carga para **hasta 24 núcleos/hilos de CPU**, tiempo de actividad del sistema (`uptime`) y cantidad de procesos activos.
  4. **Disco:** Porcentaje de ocupación del volumen principal y tasas de **lectura/escritura (`KB/s` o `MB/s`)** con sparklines.
* **Registro de Ajustes en Dispositivo (`SettingsRegistry`):** accesible desde la última página del menú, dividido en **Apariencia** (`Brillo` PWM LEDC de 8 bits a 5 kHz, `Tema` Oscuro/Claro, `Color` de acento) y **Sistema** (`Hora` NTP UTC-3, `WiFi` STA/Portal cautivo, `Calibrar` centro y rango del stick, `Precisión` de velocidad del puntero y `Dimmer` de reposo). Todo persiste en memoria no volátil **NVS**.

---

## 3. Catálogo de las 16 Capas Preconfiguradas

El menú principal (pulsación corta del encoder) presenta un selector de un nivel: girás el encoder para recorrer los grupos y presionás cualquiera de las **10 teclas físicas** para saltar directamente a la capa:

| Grupo | Capas incluidas | Funciones principales y comportamiento |
|---|---|---|
| **Trabajo** | `Edición`, `Dev`, `Apps` *(+ `Launcher` en `ALT1` y `Macros` en `ALT2`)* | **Edición:** Copiar, Pegar, Cortar, Deshacer, Rehacer, Seleccionar todo, Buscar, Guardar, Reemplazar, snippet de Email y Scroll en encoder. **Dev:** Terminal integrada, Paleta de comandos, Comentar, Run (`F5`), Macro `Build` (`Ctrl+\` + npm run build`), Ir a archivo, Símbolo, Formatear, Renombrar y Zoom en encoder. **Apps:** salto a ventanas `Win+1..4`, Escritorio, cambiar escritorio virtual, `Alt+Tab`, Maximizar/Minimizar. |
| **Multimedia** | `Multimedia`, `YouTube`, `Netflix`, `Spotify`, `Disney+` | Controles globales HID Consumer (`Play/Pause`, `Prev`, `Next`, `Mute`, `Stop`, `Volumen`) y capas específicas para reproductores web con salto `±10 s`, pantalla completa (`F`), subtítulos (`C`) y velocidad de reproducción (`Shift+<` / `Shift+>`). |
| **Web** | `Navegador` | Atrás (`Alt+←`), Adelante (`Alt+→`), Recargar, Nueva pestaña, Cerrar pestaña, Reabrir pestaña cerrada (`Ctrl+Shift+T`), Marcadores, Buscar en página, Historial, Ventana incógnito y cambio de pestañas en el encoder (`Ctrl+PgUp/PgDn`). |
| **Llamadas** | `Meet`, `Slack`, `Zoom`, `Teams` | Control de micrófono, cámara, levantar la mano, compartir pantalla, chat, grabar y colgar. **Doble nivel en micrófono:** un *tap corto* envía el atajo propio de la app (`Ctrl+D`, `Alt+A`, `Ctrl+Shift+M`); un *long-press* ejecuta **mute global del micrófono a nivel sistema operativo** vía `pad-companion` (Core Audio en Windows / PipeWire en Linux). |
| **Sistema y Domótica** | `RGB`, `WiZ` | **RGB:** envía combos dedicados (`Ctrl+Alt+Shift+Tecla`) al helper `host/openrgb-rgb-layer.ahk` para cambiar colores, efectos, velocidad y brillo de los periféricos de la PC con **OpenRGB**. **WiZ:** controla luces inteligentes WiZ en la LAN por UDP a través del companion (On/Off, cambiar cuarto, temperatura cálido/frío, elegir lámpara y regular brillo con el encoder, mostrando cuarto y porcentaje real en el header del PAD). |
| **Monitor (Telemetría)** | `General`, `Red`, `Núcleos`, `Disco` | Pantallas de instrumentación dedicadas alimentadas por `pad-companion` con indicador `LIVE` (si el daemon deja de reportar por más de 5 s, el indicador pasa automáticamente a `sin PC`). |

---

## 4. Software Companion (`pad-companion`), Editor Web, Mirror SSE y PWA Directa

Los controles HID por USB y Bluetooth funcionan de manera **100% autónoma sin instalar nada en la PC**. Cuando querés sumar telemetría real del sistema operativo, control de luces WiZ, mute global de micrófono o edición visual sin recompilar, el ecosistema incluye tres herramientas locales:

1. **Servicio Headless [`pad-companion`](companion) (Windows y Linux, Node 18+ cero dependencias nativas):**
   * Corre en segundo plano al iniciar sesión (`%LOCALAPPDATA%\pad-companion` mediante Tarea Programada en Windows o `systemd --user` en Linux).
   * Lee estado real del sistema operativo: volumen maestro y estado de mute del micrófono (**Core Audio** por C# inline en Windows; **PipeWire `wpctl` / PulseAudio `pactl`** en Linux), temperatura y carga de CPU/GPU (**LibreHardwareMonitor WMI** / **`lm-sensors`**, **`nvidia-smi`**, `/proc/stat`), uso de RAM/VRAM y throughput de red/disco.
   * Empuja un `POST http://hiospad.local/api/state` autenticado con el header `X-Pad-Token` cada `pollMs` (incluyendo pre-carga del historial de red y disco para poblar los sparklines instantáneamente) y ejecuta los comandos devueltos por el PAD en la respuesta HTTP (`micToggle`, `launch`, `wiz*`).
2. **Editor Web + Espejo en Vivo (`companion/src/web`, puerto `8787`):**
   * **Espejo en tiempo real (`http://localhost:8787`):** replica exactamente la pantalla del PAD en el navegador mediante Server-Sent Events (**SSE**) usando el mismo modelo de datos del firmware.
   * **Administrador y Editor de Capas (`http://localhost:8787/admin.html`):** permite editar las capas, etiquetas, colores, macros multi-paso, textos rápidos, asignaciones de `ALT1`/`ALT2` y **variantes de atajos por sistema operativo (Windows / Linux)**. Al guardar, serializa la configuración y la envía al sistema de archivos **LittleFS** del ESP32-S3 (`POST /api/config`) en caliente, **sin recompilar el firmware**.
3. **Interfaz Web Directa embebida en el ESP32-S3 ([`src/net/WebUi.cpp`](src/net/WebUi.cpp)):**
   * Servida directamente desde memoria flash (`PROGMEM`) en `http://hiospad.local` sin necesidad de PC ni companion.
   * Funciona como **PWA instalable** desde el celular o navegador: muestra el estado de transporte y sensores, permite cambiar de capa, ofrece un **pad virtual interactivo 2×5 + encoder** que dispara las acciones reales del dispositivo (`POST /api/cmd`) y un editor rápido de nombres, colores y etiquetas de teclas.

---

## 5. Edición para Juegos: Firmware Gamepad / Gaming Keypad (Mismo Hardware)

Dado que el hardware del HIOS PAD combina una **matriz mecánica/táctil 2×5 con diodos independientes por tecla**, **2 pulsadores laterales `ALT`**, un **joystick analógico de pulgar sobre ADC de 12 bits**, un **encoder con pulsador** y **USB nativo en el ESP32-S3 (TinyUSB)**, la misma unidad física está preparada para correr una **variante de firmware orientada a juegos (Gaming Keypad & HID Gamepad)**:

* **N-Key Rollover real sin Ghosting:** gracias a los diodos `1N4148` en cada cruce de la matriz 2×5 y a las 2 líneas `ALT` directas, podés mantener presionadas múltiples teclas simultáneamente (por ejemplo, movimiento diagonal + correr + saltar + recargar o activar habilidades) sin bloqueos ni pulsaciones fantasma.
* **Doble modo de Joystick Analógico (360° o D-Pad / WASD):**
  * **Modo Eje Analógico (XInput / HID Gamepad):** reporta ejes X/Y continuos con la calibración de centro, rango y zona muerta guardada en NVS, permitiendo liberar cuatro dedos de la mano izquierda que normalmente estarían ocupados en `WASD`.
  * **Modo D-Pad / 8 Direcciones:** traduce el stick analógico en pulsaciones direccionales con histéresis configurable y doble umbral (inclinación suave = caminar; inclinación completa = correr/sprint).
* **Capas y HUD por Género en la Pantalla 480×320:**
  * **Perfil FPS / Shooter:** teclas 1–10 asignadas a armas, recarga, granadas, curación, mapa e inventario; `ALT1` = agacharse/deslizarse; `ALT2` = saltar o Push-to-Talk; stick = movimiento o inclinación (*lean*).
  * **Perfil MOBA / ARPG / MMO:** grilla 2×5 dedicada a habilidades `Q/W/E/R`, objetos activos `1–6`, pings tácticos en el stick y nivelación o cámara en el encoder.
  * **Perfil Simulación (Vuelo / Sim-Racing):** botonera de cabina (*button box*) con etiquetas claras en pantalla para tren de aterrizaje, flaps, luces, mezcla/freno de mano, telemetría en vivo en el display ILI9488 y ajuste fino de trim/bias en el encoder rotativo.
* **Feedback Acústico y Lumínico por Perfil:** los amplificadores I2S duales (`2× MAX98357A`) permiten emitir confirmaciones sonoras de cambio de perfil o temporizadores de *cooldown*, mientras que las 2 zonas NeoPixel cambian de color según el perfil de juego activo.

---

## 6. Arquitectura de Firmware (FreeRTOS Dual-Core)

El firmware divide el trabajo entre los dos núcleos Xtensa LX7 del ESP32-S3 a 240 MHz comunicados por colas y mailboxes sin bloqueo (`xQueueOverwrite`):

* **`inputTask` (Core 1 — Tiempo Real):** escanea la matriz 2×5, los 2 `ALT`, el encoder KY-040 y el ADC del joystick → `Dispatcher` resuelve la acción según la capa activa → encola acciones HID y publica el `UiSnapshot`.
* **`transportTask` (Core 1 — Tiempo Real):** consume la cola de acciones y las transmite por el transporte activo (**USB nativo TinyUSB** o **Bluetooth BLE NimBLE** con auto-switch: enchufado usa USB, desenchufado conmuta a BLE).
* **`uiTask` (Core 0 — Motor Gráfico):** consume el último `UiSnapshot` y ejecuta el render parcial del dashboard `Cards`, de las 4 vistas de `Monitor`, del menú o del portal cautivo.
* **`netTask` (Core 0 — Red y API):** administra WiFi STA, portal cautivo de configuración (`HIOS-PAD-setup`), sincronización horaria NTP (`pool.ntp.org`), mDNS (`hiospad.local`), actualizaciones OTA y el servidor HTTP (`/api/state`, `/api/config`, `/api/ui`, `/api/cmd`).

---

## 7. Hardware y Especificaciones Eléctricas

* **Microcontrolador:** **ESP32-S3-DevKitC-1 N16R8** (16 MB Flash Quad SPI + 8 MB PSRAM Octal AP Memory a 3.3 V). *Nota: la PSRAM octal ocupa los GPIO 33–37 y la flash los GPIO 26–32.*
* **Pantalla:** **ILI9488 4.0"** `480×320` SPI (HSPI a 27 MHz, backlight con dimming PWM LEDC de 8 bits en `BL_CANAL = 0` a 5 kHz).
* **Controles:** **Encoder KY-040** + **Joystick HW-504** (alimentado estrictamente a **3.3 V** para no saturar el ADC1 del S3 ni acoplar ejes) + **12 pulsadores NA a GND** (10 en matriz 2×5 con diodos `1N4148` + 2 `ALT` directos).
* **Audio Estéreo I2S:** **2× MAX98357A** compartiendo bus I2S (`BCLK`, `LRC`, `DOUT`); selección de canal por pin `SD` (Canal Izquierdo: `SD` directo a `Vin`; Canal Derecho: `SD` mediante resistor de **360 kΩ** a `Vin`, ~1.09 V; un 390 kΩ también cae en la ventana del canal derecho).
* **Iluminación:** **8× WS2812B (NeoPixel)** en 2 placas de 4 LEDs en serie sobre `GPIO9` (vía resistor de 330 Ω), divididas por software en 2 zonas independientes.
* **Alimentación:** Pack **Li-Ion 2S (2× 18650, 7.4 V nominal / 8.4 V carga)** con BMS 2S USB-C + regulador step-down **LM2596S con display voltímetro ajustado a 5.0 V** y llave de corte `SW-CELDAS`.
* **Guía de cableado verificada paso a paso:** consultá **[/pinouts/pad](/pinouts/pad)**, verificada automáticamente contra [`src/app/Pins.h`](src/app/Pins.h) y [`platformio.ini`](platformio.ini) mediante `npm run test:wiring`.

---

## 8. Primeros pasos, Flasheo y OTA

```bash
cd projects/pad

# Compilar y flashear por cable (puerto UART / CH343)
pio run -t upload

# Abrir monitor serie (muestra el token API/OTA al arrancar)
pio device monitor -b 115200
```

1. **Token de seguridad (`token API/OTA`):** en el primer arranque el firmware genera un token aleatorio único en NVS y lo imprime por el monitor serie. Copialo en `companion/config.json` para autenticar `POST /api/state`, `/api/config` y las actualizaciones OTA.
2. **Precaución eléctrica al conectar USB:** con el pack 2S conectado, **abrí siempre `SW-CELDAS` antes de enchufar el cable USB** para no unir `VBUS` con la salida de `5.0 V` del buck LM2596S. Para actualizar sin tocar cables, usá **OTA por WiFi** (requiere el token de seguridad impreso al boot):
   ```bash
   # Vía PlatformIO directo: [env:ota] lee el token de PAD_OTA_TOKEN (--auth)
   PAD_OTA_TOKEN=<TOKEN> pio run -e ota -t upload --upload-port 192.168.1.43

   # O usando el script con soporte para WSL2 / Linux:
   ./flash-ota.sh 192.168.1.43 <TOKEN>
   ```
3. **Flasheo desde WSL (Windows Subsystem for Linux):** el puerto UART (`CH343`) requiere adjuntarse desde PowerShell con `usbipd list` → `usbipd attach --wsl --busid <id>` para aparecer como `/dev/ttyACM0` en Linux. El puerto USB nativo del S3 (`303a:1001`) queda dedicado al transporte HID.

---

## 9. Notas de Ingeniería y Decisiones de Diseño

* **Inicialización de fuentes en `TFT_eSprite`:** crear un `TFT_eSprite` deja `gfxFont` sin inicializar, lo que provocaba un *boot loop* al dibujar texto; siempre se invoca `setTextFont(1)` inmediatamente después de instanciar cada sprite.
* **Por qué el Joystick va a 3.3 V y no a 5 V:** alimentar el potenciómetro del HW-504 a 5 V satura el rango del ADC del ESP32-S3 (~3.1 V máx. con `ADC_11db`) en el último tercio del recorrido y genera acoplamiento entre ejes (diagonales fantasma).
* **Aislamiento de símbolos USB HID vs NimBLE:** `USBHIDKeyboard.h` y las librerías BLE definen símbolos `KEY_*` y `KeyReport` incompatibles; se aislaron en unidades de traducción separadas dentro de `src/transport/` mediante fábricas (`ITransport`).
* **Medición de batería en el voltímetro del buck:** el divisor resistivo en `GPIO9` se descartó (`cfg::BATTERY_ENABLED = false`) porque el display del módulo LM2596S ya indica la tensión real del pack 2S en la carcasa y `GPIO9` quedó asignado como línea de datos limpia para los NeoPixels (dejando `UART0` en `43/44` libre para flasheo y logs sin parpadeos de arranque).

## Créditos

La perilla impresa en 3D del joystick analógico está basada en [este modelo de Thingiverse](https://www.thingiverse.com/thing:6189483). Las piezas STL listas para imprimir e inspeccionar en el visor 3D están disponibles en la sección **[Maker (/prints#prints-pad)](/prints#prints-pad)**.
