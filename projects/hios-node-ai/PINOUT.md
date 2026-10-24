# HIOS Node AI — Pinout y conexiones

Distribución de pines del nodo sobre la **ESP32-S3-DevKitC-1 (N16R8)**. La tabla completa (con rieles, BOM y checklist) se genera en [`hardware/README.md`](hardware/README.md) y `npm run test:hardware` la compara contra `src/main.cpp`.

---

## Diagrama

```
 18650 ─► TP4056 (B+/B−) ─► OUT+ ─► SW1 ─┬─► U3V40F5 VIN      VOUT 5V ─┬─► MAX98357A VIN (+220µF)
                                          │   EN ─[22k]─ GND            └─► SS34 ─► DevKit 5V (J1-21)
                                          └─[100k]─┬─[100k]─ GND
                                                   └─► GPIO1 (VBAT, +100nF)

                 +--------------------------------+
                 |     ESP32-S3-DevKitC-1 N16R8   |
                 +--------------------------------+
   OLED 3V3  ◄───| 3V3                     GND    |─── GND común
                 | GPIO 1  VBAT (ADC1)     GPIO 4 |─── Botón PTT (a GND)
   INMP441 SCK ◄─| GPIO 42                 GPIO 2 |─── 330Ω ─► LED ─► GND
   INMP441 WS  ◄─| GPIO 41                 GPIO 8 |─── OLED SDA
   INMP441 SD  ─►| GPIO 40                 GPIO 9 |─── OLED SCL
   MAX BCLK    ◄─| GPIO 15                        |
   MAX LRC     ◄─| GPIO 16                        |
   MAX DIN     ◄─| GPIO 17                        |
                 +--------------------------------+
```

---

## Tabla de conexiones por módulo

### 1. Micrófono I2S (INMP441)
| Pin INMP441 | Pin ESP32-S3 | Descripción |
|-------------|--------------|-------------|
| VDD         | 3V3          | 1.8–3.3V: **nunca a 5V** |
| GND         | GND          | Tierra |
| SCK         | GPIO 42      | Serial Clock |
| WS          | GPIO 41      | Word Select |
| SD          | GPIO 40      | Serial Data (hacia el ESP32) |
| L/R         | GND          | Canal izquierdo |

### 2. Amplificador I2S (MAX98357A)
| Pin MAX98357A | Conexión | Descripción |
|---------------|----------|-------------|
| VIN           | 5V del U3V40F5 | Antes del SS34; 220µF a GND pegado al módulo |
| GND           | GND      | Tierra |
| BCLK          | GPIO 15  | Bit Clock |
| LRC           | GPIO 16  | Left/Right Clock |
| DIN           | GPIO 17  | Data Input |
| GAIN          | GND      | 12 dB |
| SD            | VIN      | Encendido (canal izquierdo); el firmware manda el mismo sample en L y R |
| OUT+ / OUT−   | Parlante 4Ω 3W | Ningún borne a GND |

### 3. Display OLED SSD1306 (I2C 0x3C)
| Pin OLED | Pin ESP32-S3 | Descripción |
|----------|--------------|-------------|
| VCC      | 3V3          | Alimentación |
| GND      | GND          | Tierra |
| SDA      | GPIO 8       | Default de `Wire` en el S3 |
| SCL      | GPIO 9       | Default de `Wire` en el S3 |

### 4. Energía y batería
| Desde | Hacia | Nota |
|-------|-------|------|
| 18650 + / − | TP4056 B+ / B− | Módulo con protección (DW01A + FS8205A) |
| TP4056 OUT+ | SW1 → U3V40F5 VIN | Interruptor de encendido |
| TP4056 OUT+ (después de SW1) | 100k → GPIO1 → 100k → GND | 4.2V → 2.1V; 100nF de GPIO1 a GND |
| U3V40F5 EN | 22kΩ → GND | Corte por baja tensión ≈3.06V |
| U3V40F5 VOUT | MAX98357A VIN | 5V |
| U3V40F5 VOUT | SS34 (ánodo) → DevKit 5V (cátodo) | El diodo evita el conflicto con el USB |
| TP4056 OUT− | GND común | |

---

## Por qué estos pines

1. **GPIO22–25 no existen en el ESP32-S3** y **GPIO26–37** los usa la flash/PSRAM octal del N16R8. El diseño anterior tenía SCL en GPIO22: no funcionaba.
2. **Pines de arranque** 0, 3, 45 y 46: libres. Tampoco se usan 19/20 (USB), 43/44 (UART0) ni 38 (LED RGB de la placa v1.1).
3. **GPIO1 es ADC1**: mide con el WiFi encendido (ADC2 no).
4. **Dos puertos I2S**: el micrófono queda para `I2S_NUM_0` y el ampli usa `I2S_NUM_1`.
