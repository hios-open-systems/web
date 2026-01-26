# HIOS BTDAC - Bluetooth Audio Receiver

Receptor de audio Bluetooth A2DP con ESP32 y DAC PCM5102.

## Pinout

### PCM5102 (DAC)

| PCM5102 | ESP32 GPIO |
| ------- | ---------- |
| BCK     | 27         |
| LCK     | 14         |
| DIN     | 13         |
| SCK     | GND        |
| GND     | GND        |
| VIN     | 5V         |

### LED RGB (KY-009)

| LED | ESP32 GPIO | Resistencia |
| --- | ---------- | ----------- |
| R   | 4          | 330Ω        |
| G   | 16         | 330Ω        |
| B   | 17         | 330Ω        |
| -   | GND        | -           |

## Estados del LED

| Color     | Comportamiento     | Estado             |
| --------- | ------------------ | ------------------ |
| 🔵 Azul   | Parpadeante lento  | Esperando conexión |
| 🔵🟢 Cyan | Parpadeante rápido | Conectando         |
| 🟢 Verde  | Fijo               | Conectado          |
| 🟢 Verde  | Parpadeante        | Reproduciendo      |
| 🔴 Rojo   | Parpadeante        | Error              |

## Uso

1. Encender el dispositivo
2. En el teléfono, buscar **"HIOS BTDAC"** en Bluetooth
3. Conectar y reproducir música
4. El Serial Monitor muestra título/artista/álbum

## Serial Monitor (115200 baud)

```
═══════════════════════════════════════════════════════════
              HIOS BTDAC - Bluetooth Audio
═══════════════════════════════════════════════════════════
Dispositivo: HIOS BTDAC
Pines I2S: BCK=27, LCK=14, DIN=13
═══════════════════════════════════════════════════════════
[LED] Test de colores...
[I2S] Configurando...
[BT] Iniciando Bluetooth...
[OK] Sistema listo
═══════════════════════════════════════════════════════════
[BT] ¡Conectado!
[Audio] ▶ Reproduciendo
[Track] 🎵 Song Title
[Track] 👤 Artist Name
[Track] 💿 Album Name
```

## Instalación

### PlatformIO (recomendado)

```bash
pio run -t upload
pio device monitor
```

### Arduino IDE

1. Instalar librería **ESP32-A2DP** (Phil Schatzmann)
2. Seleccionar placa **ESP32 Dev Module**
3. Subir

## Configuración

Podés modificar en el código:

```cpp
const char* BT_DEVICE_NAME = "HIOS BTDAC";  // Nombre Bluetooth
const int INITIAL_VOLUME = 100;              // Volumen 0-127
```

---

_HIOS BTDAC - HI Open Systems_
