# HIOS WiFi Speaker — cableado y BOM

> Generado por `scripts/gen-hardware-docs.ts` desde `config/hardware/`. No editar a mano: corré `npm run gen:hardware`.

MCU: **ESP32-WROOM-32** · rev 1.0

Pines verificados contra el firmware (`projects/speaker/src/main.ino`) en cada `npm test`.

Esquema: [`schematic.svg`](schematic.svg) · BOM: [`BOM.csv`](BOM.csv). Es cableado entre módulos (breakouts), no una PCB.

## Advertencias

- ⚠️ El divisor de VBAT del firmware (100k/100k) NO es apto para 2S: a 8.4V entrega 4.2V sobre GPIO34. Rediseñalo y recalibrá antes de conectarlo.
- ⚠️ El canal L/R de cada MAX98357 lo elige su pin SD: medilo con la calculadora de SD, no lo asumas.

## Conexiones por módulo

### Energía

Alimentación: pack 2S → BMS → LM2596 a 5.0V → riel 5V

### 2× MAX98357 (I2S)

Alimentación: Vin → 5V · GND → GND

| GPIO | Señal | Hacia | Nota |
|---|---|---|---|
| 25 | I2S DOUT | → DIN de AMBOS MAX98357 (bus) |  |
| 26 | I2S BCLK | → BCLK de ambos amplis |  |
| 27 | I2S LRC | → LRC de ambos amplis |  |

### LCD 16×2 (I2C)

Alimentación: VCC → 5V · GND → GND

| GPIO | Señal | Hacia | Nota |
|---|---|---|---|
| 21 | I2C SDA | → SDA del LCD 16×2 (0x27) |  |
| 22 | I2C SCL | → SCL del LCD |  |

### Medición de batería — revisar

Alimentación: Referencia del firmware: 100k/100k → GPIO34. NO conectar a 2S: 8.4V → 4.2V.

| GPIO | Señal | Hacia | Nota |
|---|---|---|---|
| 34 | VBAT ADC | Firmware: divisor 100k/100k (×2), pendiente de rediseño para 2S | GPIO34 es solo entrada. A 8.4V este divisor entrega 4.2V: no lo conectes al ADC del ESP32. |

## Rieles

| Riel | Conecta |
|---|---|
| 5V | ESP32 VIN · 2× MAX98357 Vin · LCD VCC · del LM2596 (buck ≥2–3A) |
| GND común | ESP32 · amplis · LCD · buck · BMS (1 sola masa) |

## Detalle por bloque

### ⚡ Energía

Los parlantes aumentan el pico: buck ≥2–3A y capacitor de reserva. No conectes el divisor 100k/100k del firmware a 2S: 8.4V se convierten en 4.2V sobre GPIO34. Dimensioná el divisor para el rango del ADC y las tolerancias; después actualizá la escala y calibración del firmware.

| Pin | Qué | Hacia | Nota |
|---|---|---|---|
| VIN | ESP32 5V | del LM2596 OUT+ |  |
| 34 | VBAT (pendiente de revisión) | 100k/100k (×2): 8.4V → 4.2V; NO conectar a GPIO34 |  |
| GND | Masa común | todo junto |  |

### 📟 LCD 16×2 (I2C)

Backpack PCF8574 en 0x27 (a veces 0x3F). VCC a 5V; contraste con el potenciómetro trasero. Revisá los pull-ups: si SDA/SCL suben a 5V, usá conversión de nivel I2C adecuada; no conectes lógica de 5V directamente al ESP32.

| Pin | Qué | Hacia | Nota |
|---|---|---|---|
| 21 | SDA | → SDA del LCD |  |
| 22 | SCL | → SCL del LCD |  |

## BOM

| Cant. | Componente | Función | Notas | Fuente |
|---|---|---|---|---|
| 1 | ESP32 DevKit (WROOM-32) | Control, WiFi y Bluetooth | WiFi 2.4GHz | `projects/speaker/README.md` |
| 2 | MAX98357 breakout | Amplificador I2S, uno por canal | canal elegido por SD: medir | `projects/speaker/README.md` |
| 2 | Parlante 4–8Ω | Salida L y R | directo a los bornes del ampli (filterless) | `projects/speaker/README.md` |
| 1 | LCD 16×2 + backpack I2C (PCF8574) | Estado, volumen y título | dirección 0x27 en el firmware; verificar niveles I2C | `projects/speaker/README.md` |
| 1 | LM2596S con display | Regulador a 5.0V | buck ≥2–3A por los parlantes | `config/pinouts/speaker.ts` |
| 1 | Cargador y protección 2S USB-C | Carga del pack |  | `projects/speaker/README.md` |
| 2 | Celda 18650 | Batería 2S en serie |  | `projects/speaker/README.md` |
| 1 | Portapilas 2× 18650 en serie | Soporte del pack |  | `projects/speaker/README.md` |
| ¿? | Resistencias divisor VBAT | Medición de batería en GPIO34 | PENDIENTE: el 100k/100k del firmware no es apto para 2S; valores a definir | `config/pinouts/speaker.ts` |
| ¿? | Resistencias de SD | Selección de canal L/R | valor según calculadora de SD y breakout | `projects/speaker/README.md` |
| 3 | Piezas impresas 3D | Gabinete, bafle frontal, tapa posterior | STL en public/downloads/speaker/ | `config/prints/speakerPrints.ts` |

`¿?` = la cantidad no está documentada todavía.

## Checklist antes de energizar

- [ ] LM2596 medido a 5.0V (≥2–3A por los parlantes) antes de conectar
- [ ] I2S: DOUT=25, BCLK=26, LRC=27 → AMBOS MAX98357 (bus compartido)
- [ ] MEDÍ cada pin SD. Usá el cálculo de SD y las ventanas garantizadas de cada canal, incluyendo el pull-up de la placa si existe.
- [ ] GAIN flotante = 9 dB · parlante 4–8Ω directo (filterless)
- [ ] LCD I2C: SDA=21 / SCL=22, dirección 0x27; verificá niveles lógicos seguros antes de conectar
- [ ] VBAT: reemplazá el divisor 100k/100k antes de conectar 2S a IO34 y actualizá la escala/calibración del firmware
- [ ] Masa común: ESP32, amplis, LCD, buck, BMS
