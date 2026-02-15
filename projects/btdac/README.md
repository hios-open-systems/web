# HIOS BTDAC - Bluetooth Audio Receiver & Smart Controller

Receptor de audio Bluetooth A2DP de alta fidelidad con capacidades de control inteligente vía BLE (Bluetooth Low Energy).

## Quick Start

### Firmware (ESP32)

```bash
# Entrar al directorio del proyecto
cd projects/btdac

# Compilar y subir firmware (PlatformIO)
# Nota: La primera vez descargará librerías para Dual Mode
pio run -t upload

# Monitor serial (para ver logs de conexión y comandos)
pio device monitor
```

### App Android (Control)

```bash
# Abrir proyecto en Android Studio
projects/btdac/android
# O compilar desde terminal (requiere JDK 17+)
./gradlew installDebug
```

## ¿Qué es?

El HIOS BTDAC v2 evoluciona de un simple receptor de audio a un dispositivo inteligente con arquitectura híbrida:

1.  **Audio Sink (Classic BT):** Recibe música en alta calidad (A2DP) mediante el DAC PCM5102 (SNR 112dB).
2.  **Smart Control (BLE):** Canal de datos simultáneo que permite controlar el dispositivo desde la App Android sin interrumpir la música.

### Funcionalidades Actuales

- [x] **Streaming A2DP:** Audio estéreo 44.1kHz / 16-bit.
- [x] **Dual Mode:** Conexión simultánea de Audio + App de Control.
- [x] **Tone Generator:** Generador de señales de prueba (Senoidal) integrado en el DSP del ESP32, activable remotamente.
- [x] **RGB Status:** Feedback visual de estado (Conectando, Reproduciendo, Error).

## Hardware

| Componente          | Función                             |
| ------------------- | ----------------------------------- |
| **ESP32 DevKit V1** | MCU Dual Core + Radio (BT/BLE/WiFi) |
| **PCM5102 DAC**     | Conversión Digital-Analógica (I2S)  |
| **LM2596**          | Fuente DC-DC 5V (Eficiencia >90%)   |
| **Batería 2S**      | 2x 18650 para >12h de autonomía     |

Ver lista de materiales detallada en [COMPONENTS.md](COMPONENTS.md)

## Conexiones I2S

```
ESP32 GPIO27 → PCM5102 BCK
ESP32 GPIO14 → PCM5102 LRCK
ESP32 GPIO13 → PCM5102 DIN
PCM5102 SCK  → GND (Modo interno PLL)
```

## Protocolo de Control (BLE)

La App se comunica mediante un servicio GATT personalizado:

- **Service UUID:** `4fafc201-1fb5-459e-8fcc-c5c9c331914b`
- **Char UUID:** `beb5483e-36e1-4688-b7f5-ea07361b26a8`

### Comandos Soportados

| Comando  | Ejemplo     | Descripción                               |
| -------- | ----------- | ----------------------------------------- |
| Tone Gen | `tone:1000` | Genera una onda senoidal de 1000Hz por 2s |

## Estructura del Proyecto

```
btdac/
├── android/           # App nativa de control (Kotlin + Compose)
├── src/
│   └── HIOS_BTDAC.ino # Firmware (Dual Mode: A2DP + BLE)
├── platformio.ini     # Configuración con partición 'min_spiffs'
├── PINOUT.md          # Diagrama de conexiones
├── COMPONENTS.md      # BOM
└── README.md          # Este archivo
```

## Estado del Proyecto

**Fase 2: Smart Audio** - Arquitectura híbrida funcional.

- [x] Firmware Dual Mode (A2DP + BLE)
- [x] App Android Básica (Scan + Connect)
- [x] Generador de Tonos Remoto
- [ ] Monitor de Batería (Hardware v2)
- [ ] Ecualizador DSP
- [ ] Soporte WiFi Streaming (Fase 3)

## Dev Log / Changelog

### v0.5 - Arquitectura Híbrida (Feb 15, 2026)

Transformación de "Audio Receptor" a "Smart Device".

- **Firmware (Dual Mode):** Implementación de A2DP (Audio) y BLE (Control) simultáneos.
- **DSP Engine:** Generador de ondas senoidales por software inyectado directo al buffer I2S para pruebas de audio.
- **Android App:** Lanzamiento inicial (Kotlin/Compose). Scanner con filtro de UUID propietario y control de tonos.
- **Protocolo:** Definición de comandos GATT (`tone:freq`).

### Ideas en el Radar (Backlog)

- **Modo WiFi Hi-Res:** Streaming FLAC directo (Spotify Connect / DLNA) para superar la compresión del Bluetooth.
- **Herramientas de Calibración:** Ruido rosa y sweep de frecuencia automático para testear parlantes y crossovers.
- **OTA Updates:** Actualización de firmware desde la app sin cables.
- **Monitor de Batería:** Lectura analógica + notificación BLE para saber cuándo cargar.

## Links

- [GitHub](https://github.com/hios-open-systems/web/tree/main/projects/btdac)
- [Web](https://openhios.dev/projects/btdac)

## Licencia

Open Hardware - Usa, modifica y comparte libremente.

---

_HIOS BTDAC - HI Open Systems_
