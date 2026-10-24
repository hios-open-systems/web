# HIOS Speaker Test — cableado y BOM

> Generado por `scripts/gen-hardware-docs.ts` desde `config/hardware/`. No editar a mano: corré `npm run gen:hardware`.

MCU: **ESP32 (clásico, con Bluetooth Classic)** · rev —

Pines verificados contra el firmware (`projects/speaker-test/src/tone_test.cpp + song.cpp`) en cada `npm test`.

Esquema: [`schematic.svg`](schematic.svg) · BOM: [`BOM.csv`](BOM.csv). Es cableado entre módulos (breakouts), no una PCB.

## Advertencias

- ⚠️ Banco de pruebas: usa pines I2S distintos al Speaker final (BCLK=26, LRC=25, DIN=22 acá; 26/27/25 en el Speaker).
- ⚠️ Los valores de las resistencias de SD (100kΩ izquierdo, 220kΩ derecho) dependen del breakout: el README pide ajustarlas al probar.

## Conexiones por módulo

### Energía

Alimentación: 5V (VIN/VBUS) del ESP32 → Vin de ambos amplis

### 2× MAX98357A (I2S)

Alimentación: Vin → 5V · GND → GND

Carga: 1 parlante por ampli, a sus bornes + / −

| GPIO | Señal | Hacia | Nota |
|---|---|---|---|
| 22 | I2S DIN | → DIN de AMBOS MAX98357A |  |
| 25 | I2S LRC | → LRC de AMBOS MAX98357A |  |
| 26 | I2S BCLK | → BCLK de AMBOS MAX98357A |  |

## Rieles

| Riel | Conecta |
|---|---|
| 5V | ESP32 VIN · Vin de los dos MAX98357A (no 3V3) |
| GND común | ESP32 · los dos MAX98357A |

## BOM

| Cant. | Componente | Función | Notas | Fuente |
|---|---|---|---|---|
| 1 | ESP32 clásico (no S3) | Sink Bluetooth A2DP | el S3 no tiene Bluetooth Classic | `projects/speaker-test/README.md` |
| 2 | MAX98357A breakout | Amplificador I2S L y R |  | `projects/speaker-test/README.md` |
| 2 | Parlante | Bajo prueba |  | `projects/speaker-test/README.md` |
| 1 | Resistencia 100kΩ | SD → Vin del amp izquierdo | ajustar según breakout | `projects/speaker-test/README.md` |
| 1 | Resistencia 220kΩ | SD → Vin del amp derecho | ajustar según breakout | `projects/speaker-test/README.md` |

`¿?` = la cantidad no está documentada todavía.

## Checklist antes de energizar

- [ ] Amplis alimentados desde 5V (VIN), no desde 3V3
- [ ] I2S en paralelo a los dos amplis: BCLK=26, LRC=25, DIN=22
- [ ] Amp izquierdo: 100kΩ entre SD y Vin · amp derecho: 220kΩ entre SD y Vin (ajustar según breakout)
- [ ] Cada parlante a los bornes + / − de su propio ampli
