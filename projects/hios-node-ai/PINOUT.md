# HIOS Node AI — Guía de Pinout y Diagrama de Conexiones

Este documento especifica la distribución de pines (GPIO) y las conexiones de hardware del nodo HIOS AI sobre la placa ESP32-S3-DevKitC-1.

---

## Diagrama ASCII de Conexiones

```
                 +--------------------------------+
                 |         ESP32-S3 (N16R8)       |
                 +--------------------------------+
                 | 3V3                     GND    |--- GND Común
                 | 5V                      GPIO 4 |--- Botón PTT (a GND)
                 | GPIO 42 (I2S Mic SCK)   GPIO 2 |--- LED Status (vía 330Ω a GND)
                 | GPIO 41 (I2S Mic WS)    GPIO 21|--- Display OLED SDA
                 | GPIO 40 (I2S Mic SD)    GPIO 22|--- Display OLED SCL
                 | GPIO 15 (I2S Amp BCLK)         |
                 | GPIO 16 (I2S Amp LRC)          |
                 | GPIO 17 (I2S Amp DIN)          |
                 +--------------------------------+
```

---

## Tabla de Conexiones por Módulo

### 1. Micrófono I2S (INMP441)
| Pin INMP441 | Pin ESP32-S3 | Descripción |
|-------------|--------------|-------------|
| VDD         | 3V3          | Alimentación 3.3V limpia |
| GND         | GND          | Tierra |
| SCK / BCLK  | GPIO 42      | Serial Clock |
| WS / LRC    | GPIO 41      | Word Select (Left/Right Clock) |
| SD / DOUT   | GPIO 40      | Serial Data |
| L/R         | GND          | Selección de canal (GND = Izquierdo) |

### 2. Amplificador Audio I2S (MAX98357A)
| Pin MAX98357A | Pin ESP32-S3 | Descripción |
|---------------|--------------|-------------|
| VIN           | 5V / VBUS    | Alimentación de potencia 5V |
| GND           | GND          | Tierra |
| BCLK          | GPIO 15      | Bit Clock Audio |
| LRC           | GPIO 16      | Left/Right Clock |
| DIN           | GPIO 17      | Data Input |
| GAIN          | GND          | Ganancia fija (+12dB) |

### 3. Display OLED SSD1306 (I2C)
| Pin OLED | Pin ESP32-S3 | Descripción |
|----------|--------------|-------------|
| VCC      | 3V3          | Alimentación 3.3V |
| GND      | GND          | Tierra |
| SDA      | GPIO 21      | Data I2C |
| SCL      | GPIO 22      | Clock I2C |

---

## Notas Importantes de Hardware

1. **Evitar Strapping Pins**: Los pines GPIO 0, 3, 45, 46 del ESP32-S3 determinan el modo de booteo del chip. No conectar cargas resistivas fuertes en ellos.
2. **Desacoplamiento de Alimentación**: Colocar un capacitor electrolítico de 220µF entre 5V y GND cerca del módulo MAX98357A para mitigar caídas de tensión por picos de sonido.
