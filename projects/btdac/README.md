# HIOS BTDAC - Bluetooth Audio Receiver

Receptor de audio Bluetooth A2DP con ESP32 y DAC PCM5102.

## Quick Start

```bash
# Clonar el repositorio
git clone https://github.com/hios-open-systems/web.git
cd web/projects/btdac

# Subir firmware (PlatformIO)
pio run -t upload

# Monitor serial
pio device monitor
```

## Que es?

Receptor Bluetooth portatil que convierte cualquier equipo de audio en inalambrico:
- Audio Bluetooth A2DP de alta calidad
- DAC PCM5102 con 112dB SNR
- Bateria recargable USB-C (12+ horas)
- LED RGB de estado
- Salida line level (Jack 3.5mm)

## Hardware

| Componente | Funcion | ~USD |
|------------|---------|------|
| ESP32 DevKit 38-pin | Micro + BT | $12 |
| PCM5102 DAC | Conversor audio | $10 |
| LM2596 DC-DC | Fuente 5V | $3 |
| 2x 18650 | Bateria | $12 |
| BMS 2S USB-C | Carga + proteccion | $6 |
| LED RGB KY-009 | Indicador | $2 |
| Resistor 330Ω | x3 para LED | $1 |
| Varios | Cables, PCB | $5 |
| **Total** | | **~$51** |

Ver detalles en [COMPONENTS.md](COMPONENTS.md)

## Conexiones rapidas

```
ESP32 GPIO26 → PCM5102 BCK
ESP32 GPIO25 → PCM5102 LRCK
ESP32 GPIO22 → PCM5102 DIN
PCM5102 SCK  → GND (importante!)
```

Ver diagrama completo en [PINOUT.md](PINOUT.md)

## Estados del LED

| Color | Comportamiento | Estado |
|-------|----------------|--------|
| Azul | Parpadeante lento | Esperando conexion |
| Cyan | Parpadeante rapido | Conectando |
| Verde | Fijo | Conectado |
| Verde | Parpadeante | Reproduciendo |
| Rojo | Parpadeante | Error |

## Uso

1. Encender el dispositivo
2. Buscar **"HIOS BTDAC"** en Bluetooth
3. Conectar y reproducir musica
4. El Serial Monitor muestra titulo/artista/album

## Estructura del proyecto

```
btdac/
├── README.md           # Este archivo
├── COMPONENTS.md       # Especificaciones de cada modulo
├── PINOUT.md          # Diagrama de conexiones completo
├── ASSEMBLY.md        # Guia de armado paso a paso
├── TROUBLESHOOTING.md # Problemas comunes
├── platformio.ini     # Configuracion PlatformIO
├── src/
│   └── HIOS_BTDAC.ino # Firmware principal
├── tests/
│   └── HIOS_BTDAC_minimal_test.ino
├── android/           # App Android (roadmap)
└── pics/
    ├── modules/       # Fotos de componentes
    └── build/         # Fotos del proyecto armado
```

## Estado

**Prototipo funcional** - Testeado y funcionando.

- [x] Hardware completo
- [x] Firmware funcional
- [x] Documentacion completa
- [x] 12+ horas de bateria
- [ ] App Android
- [ ] PCB custom

## Links

- [GitHub](https://github.com/hios-open-systems/web/tree/main/projects/btdac)
- [Web](https://openhios.dev/projects/btdac)

## Licencia

Open Hardware - Usa, modifica y comparte libremente.

---

_HIOS BTDAC - HI Open Systems_
