# HIOS WiFi Speaker

Parlante WiFi con ESP32, amplificador I2S MAX98357 y control via web.

## Quick Start

```bash
# Clonar el repositorio
git clone https://github.com/hios-open-systems/web.git
cd web/projects/speaker

# Subir firmware (PlatformIO)
pio run -t upload

# Monitor serial
pio device monitor
```

## Que es?

Speaker portatil con conectividad WiFi que permite:
- Reproducir audio desde cualquier dispositivo en la red local
- Control via interfaz web (http://hios-speaker.local)
- Audio digital I2S de alta calidad
- Bateria recargable USB-C

## Hardware

| Componente | Funcion | ~USD |
|------------|---------|------|
| ESP32 DevKit | Micro + WiFi | $8 |
| MAX98357 | Amplificador I2S | $3 |
| LM2596S c/Display | Fuente 5V | $4 |
| 2x 18650 | Bateria | $12 |
| Cargador USB-C 2S | BMS | $5 |
| Speaker 63mm 4ohm | Parlante | $3 |
| **Total** | | **~$35** |

Ver detalles en [COMPONENTS.md](COMPONENTS.md)

## Conexiones rapidas

```
ESP32 GPIO25 → MAX98357 DIN
ESP32 GPIO26 → MAX98357 BCLK
ESP32 GPIO22 → MAX98357 LRC
LM2596 5V    → ESP32 VIN + MAX98357 VIN
```

Ver diagrama completo en [PINOUT.md](PINOUT.md)

## Estructura del proyecto

```
speaker/
├── README.md           # Este archivo
├── COMPONENTS.md       # Especificaciones de cada modulo
├── PINOUT.md          # Diagrama de conexiones
├── ASSEMBLY.md        # Guia de armado paso a paso
├── TROUBLESHOOTING.md # Problemas comunes
├── platformio.ini     # Configuracion PlatformIO
├── src/
│   └── main.ino       # Firmware principal
├── tests/
│   └── test_basic.ino # Test de hardware
└── pics/
    ├── modules/       # Fotos de componentes
    └── build/         # Fotos del armado
```

## Estado

**En desarrollo** - Prototipo funcional en progreso.

- [x] Hardware definido
- [x] Documentacion base
- [x] Firmware basico
- [ ] Streaming WiFi
- [ ] App Android
- [ ] PCB custom

## Links

- [GitHub](https://github.com/hios-open-systems/web/tree/main/projects/speaker)
- [Web](https://openhios.dev/projects/speaker)

## Licencia

Open Hardware - Usa, modifica y comparte libremente.

---

_HIOS - HI Open Systems_
