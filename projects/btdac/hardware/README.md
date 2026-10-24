# HIOS BTDAC — cableado y BOM

> Generado por `scripts/gen-hardware-docs.ts` desde `config/hardware/`. No editar a mano: corré `npm run gen:hardware`.

MCU: **ESP32-WROOM-32** · rev 2.0

Pines verificados contra el firmware (`projects/btdac/src/HIOS_BTDAC.ino`) en cada `npm test`.

Esquema: [`schematic.svg`](schematic.svg) · BOM: [`BOM.csv`](BOM.csv). Es cableado entre módulos (breakouts), no una PCB.

## Conexiones por módulo

### Energía

Alimentación: pack 2S → BMS → LM2596 a 5.0V → riel 5V

### DAC PCM5102

Alimentación: VIN → 5V · GND → GND

| GPIO | Señal | Hacia | Nota |
|---|---|---|---|
| 13 | I2S DOUT | → DIN del PCM5102 |  |
| 14 | I2S LRCK | → LRCK del PCM5102 |  |
| 27 | I2S BCK | → BCK del PCM5102 |  |

### LED RGB KY-009

Alimentación: cátodo común → GND (cada color entra por su 330Ω)

| GPIO | Señal | Hacia | Nota |
|---|---|---|---|
| 4 | LED R | → 330Ω → R del KY-009 |  |
| 16 | LED G | → 330Ω → G del KY-009 |  |
| 17 | LED B | → 330Ω → B del KY-009 |  |

## Rieles

| Riel | Conecta |
|---|---|
| 5V | ESP32 VIN · PCM5102 VIN · del LM2596 (5.0V) |
| GND común | ESP32 · PCM5102 · KY-009 (cátodo) · LM2596 OUT− · BMS P− |

## Detalle por bloque

### ⚡ Energía

Ajustá el LM2596 a 5.0V con el multímetro antes de conectar. La pantalla del buck muestra la tensión del pack.

| Pin | Qué | Hacia | Nota |
|---|---|---|---|
| VIN | ESP32 5V | del LM2596 OUT+ |  |
| GND | Masa común | ESP32 + PCM5102 + KY-009 + buck |  |

### 🔊 DAC — PCM5102

I2S del ESP32 → PCM5102 (breakout GY-PCM5102). SCK del PCM5102 a GND (genera su clock). Jumpers atrás: FLT/DEMP=L, XSMT=H, FMT=L. Salida OUT L/R al jack o ampli.

| Pin | Qué | Hacia | Nota |
|---|---|---|---|
| 27 | BCK | → BCK del PCM5102 |  |
| 14 | LRCK | → LRCK del PCM5102 |  |
| 13 | DOUT | → DIN del PCM5102 |  |
| SCK | SCK del PCM5102 | → GND (no viene del ESP32) |  |

### 🌈 LED RGB — KY-009

Cátodo común (− a GND). Cada color por PWM vía 330Ω (el KY-009 no trae resistencias).

| Pin | Qué | Hacia | Nota |
|---|---|---|---|
| 4 | R | → 330Ω → R |  |
| 16 | G | → 330Ω → G |  |
| 17 | B | → 330Ω → B |  |

## BOM

| Cant. | Componente | Función | Notas | Fuente |
|---|---|---|---|---|
| 1 | ESP32-WROOM-32 DevKit (38 pines) | MCU + BT/BLE/WiFi | dual-core, BT 4.2, 4MB flash | `projects/btdac/README.md` |
| 1 | PCM5102A breakout (GY-PCM5102) | DAC I2S | SCK→GND (PLL interno); jumpers FLT=L DEMP=L XSMT=H FMT=L; pin 3.3V sin conectar | `projects/btdac/README.md` |
| 1 | LM2596S con display | Regulador a 5.0V | ajustar a 5.0V antes de conectar | `projects/btdac/README.md` |
| 1 | KY-009 | LED RGB de estado | cátodo común, sin resistencias integradas | `projects/btdac/README.md` |
| 3 | Resistencia 330Ω | Serie de cada color del LED |  | `projects/btdac/README.md` |
| 1 | Cargador BMS 2S USB-C | Carga y protección del pack | BM al punto medio entre celdas | `projects/btdac/README.md` |
| 2 | Celda 18650 | Batería 2S | celdas con tensión similar (dif < 0.1V) | `projects/btdac/README.md` |
| 1 | Portapilas 2× 18650 en serie | Soporte del pack | verificar configuración serie | `projects/btdac/README.md` |
| 1 | Capacitor 100µF | Desacople cerca del VIN del ESP32 |  | `projects/btdac/README.md` |
| 1 | Capacitor 10µF | Desacople cerca del VIN del PCM5102 |  | `projects/btdac/README.md` |
| 2 | Capacitor 100nF | Desacople (uno por módulo) | cerca del ESP32 y del PCM5102 | `projects/btdac/README.md` |
| 3 | Piezas impresas 3D | Gabinete base, tapa, bandeja PCM5102 | STL en public/downloads/btdac/ | `config/prints/btdacPrints.ts` |

`¿?` = la cantidad no está documentada todavía.

## Checklist antes de energizar

- [ ] LM2596 medido a 5.0V ANTES de conectar el ESP32/PCM5102
- [ ] Cap de desacople en el riel 5V (100µF + 100nF cerca del ESP32 y del PCM5102)
- [ ] I2S: BCK=27, LRCK=14, DOUT=13 → PCM5102
- [ ] PCM5102: SCK → GND (genera su clock por PLL, no recibe master clock)
- [ ] PCM5102: jumpers FLT=L, DEMP=L, XSMT=H, FMT=L
- [ ] LED KY-009: R=4 / G=16 / B=17 cada uno por 330Ω; cátodo común a GND
- [ ] Masa común: ESP32, PCM5102, KY-009, LM2596, BMS
- [ ] Sin cortocircuito entre 5V y GND antes de energizar
