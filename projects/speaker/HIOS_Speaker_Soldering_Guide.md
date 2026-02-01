# HIOS WiFi Speaker - Guía de Soldadura

**ESP32 + MAX98357 + LCD 16x2 I2C**

---

## ■ CHECKLIST PRE-SOLDADURA

- [ ] DC-DC ajustado a 5.0V (medir con multímetro)
- [ ] MAX98357 sin jumpers soldados (usar defaults)
- [ ] LCD I2C con dirección verificada (0x27 o 0x3F)
- [ ] Polaridad de baterías verificada
- [ ] Celdas 18650 con voltaje similar (dif < 0.1V)
- [ ] Resistencias 100kΩ verificadas (si se usa medición batería)

---

## ■ CONEXIONES - ALIMENTACIÓN

| # | DESDE | HACIA | ✓ |
|---|-------|-------|---|
| 1 | BAT1 (+) | Cargador B+ | ☐ |
| 2 | BAT2 (-) | Cargador B- | ☐ |
| 3 | BAT1(-) / BAT2(+) | Cargador BM | ☐ |
| 4 | Cargador P+ | DC-DC IN+ | ☐ |
| 5 | Cargador P- | DC-DC IN- | ☐ |
| 6 | DC-DC OUT+ | BUS 5V | ☐ |
| 7 | DC-DC OUT- | BUS GND | ☐ |

---

## ■ CONEXIONES - ESP32

| # | DESDE | HACIA | ✓ |
|---|-------|-------|---|
| 8 | ESP32 VIN | BUS 5V | ☐ |
| 9 | ESP32 GND | BUS GND | ☐ |
| 10 | ESP32 GPIO 25 | MAX98357 DIN | ☐ |
| 11 | ESP32 GPIO 26 | MAX98357 BCLK | ☐ |
| 12 | ESP32 GPIO 27 | MAX98357 LRC | ☐ |
| 13 | ESP32 GPIO 21 | LCD SDA | ☐ |
| 14 | ESP32 GPIO 22 | LCD SCL | ☐ |

---

## ■ CONEXIONES - MAX98357

| # | DESDE | HACIA | ✓ |
|---|-------|-------|---|
| 15 | MAX98357 VIN | BUS 5V | ☐ |
| 16 | MAX98357 GND | BUS GND | ☐ |
| 17 | MAX98357 DIN | ← ESP32 GPIO 25 | ☐ |
| 18 | MAX98357 BCLK | ← ESP32 GPIO 26 | ☐ |
| 19 | MAX98357 LRC | ← ESP32 GPIO 27 | ☐ |
| 20 | MAX98357 GAIN | (SIN CONEXIÓN) | — |
| 21 | MAX98357 SD | (SIN CONEXIÓN) | — |

**⚠️ GAIN sin conectar = 9dB (default). SD sin conectar = siempre ON**

---

## ■ CONEXIONES - LCD 16x2 I2C

| # | DESDE | HACIA | ✓ |
|---|-------|-------|---|
| 22 | LCD VCC | BUS 5V | ☐ |
| 23 | LCD GND | BUS GND | ☐ |
| 24 | LCD SDA | ← ESP32 GPIO 21 | ☐ |
| 25 | LCD SCL | ← ESP32 GPIO 22 | ☐ |

**⚠️ Verificar dirección I2C: 0x27 (común) o 0x3F**

---

## ■ CONEXIONES - PARLANTE

| # | DESDE | HACIA | ✓ |
|---|-------|-------|---|
| 26 | MAX98357 Speaker+ | Parlante (+) | ☐ |
| 27 | MAX98357 Speaker- | Parlante (-) | ☐ |

**⚠️ NO conectar parlante a GND común. Usar salida diferencial del MAX98357**

---

## ■ CONEXIONES - BATERÍA (opcional)

| # | DESDE | HACIA | ✓ |
|---|-------|-------|---|
| 28 | VBAT+ | R1 (100kΩ) | ☐ |
| 29 | R1 ↔ R2 | ESP32 GPIO 34 | ☐ |
| 30 | R2 (100kΩ) | GND | ☐ |

**Divisor resistivo:** `VBAT → R1(100k) → GPIO34 → R2(100k) → GND`

---

## ■ PINOUT RÁPIDO ESP32

| GPIO | FUNCIÓN | GPIO | FUNCIÓN |
|------|---------|------|---------|
| VIN | 5V entrada | GND | Masa común |
| 25 | I2S DIN | 26 | I2S BCLK |
| 27 | I2S LRC | 21 | I2C SDA |
| 22 | I2C SCL | 34 | VBAT (ADC) |

---

## ■ CONFIG. MAX98357 (defaults)

| PIN | ESTADO | EFECTO |
|-----|--------|--------|
| GAIN | Sin conectar | 9dB ganancia |
| SD | Sin conectar | Siempre habilitado |

---

## ■ CHECKLIST POST-SOLDADURA

- [ ] Continuidad de GND en todos los módulos
- [ ] Sin cortocircuito entre 5V y GND
- [ ] Voltaje en ESP32 VIN = 5.0V ± 0.1V
- [ ] Voltaje en MAX98357 VIN = 5.0V ± 0.1V
- [ ] Voltaje en LCD VCC = 5.0V ± 0.1V
- [ ] LCD enciende backlight al alimentar
- [ ] ESP32 arranca (LED onboard parpadea)
- [ ] WiFi AP visible: "HIOS-Speaker"
- [ ] Audio de prueba sale por parlante
- [ ] LCD muestra información (modo, volumen)

---

## ■ SOLUCIÓN DE PROBLEMAS

| PROBLEMA | CAUSA PROBABLE | SOLUCIÓN |
|----------|----------------|----------|
| Sin audio | LRC en pin incorrecto | Verificar GPIO27 → LRC |
| Audio distorsionado | Voltaje bajo | Verificar 5V estable |
| LCD no enciende | Dirección I2C | Probar 0x27 y 0x3F |
| LCD en blanco | Contraste | Ajustar potenciómetro trasero |
| ESP32 no arranca | Voltaje alto/bajo | Verificar DC-DC = 5.0V |
| WiFi no visible | Firmware no cargado | Flashear firmware |

---

**HIOS WiFi Speaker v3.0 | HI Open Systems | Total: 30 conexiones**
