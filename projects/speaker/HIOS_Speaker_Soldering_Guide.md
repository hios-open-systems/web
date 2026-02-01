# HIOS WiFi Speaker - Guía de Soldadura

**ESP32 + 2x MAX98357 (Estéreo) + LCD 16x2 I2C**

---

## ■ CHECKLIST PRE-SOLDADURA

- [ ] DC-DC ajustado a 5.0V (medir con multímetro)
- [ ] 2x MAX98357 sin jumpers soldados (usar defaults)
- [ ] Resistencia 1MΩ preparada para canal LEFT
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

---

## ■ CONEXIONES - MAX98357-L (Canal Izquierdo)

| # | DESDE | HACIA | ✓ |
|---|-------|-------|---|
| 10 | MAX98357-L VIN | BUS 5V | ☐ |
| 11 | MAX98357-L GND | BUS GND | ☐ |
| 12 | MAX98357-L DIN | ESP32 GPIO 25 | ☐ |
| 13 | MAX98357-L BCLK | ESP32 GPIO 26 | ☐ |
| 14 | MAX98357-L LRC | ESP32 GPIO 27 | ☐ |
| 15 | MAX98357-L SD | GND vía R 1MΩ | ☐ |
| — | MAX98357-L GAIN | (SIN CONEXIÓN) | — |

**⚠️ SD con resistencia 1MΩ a GND = Canal IZQUIERDO**

---

## ■ CONEXIONES - MAX98357-R (Canal Derecho)

| # | DESDE | HACIA | ✓ |
|---|-------|-------|---|
| 16 | MAX98357-R VIN | BUS 5V | ☐ |
| 17 | MAX98357-R GND | BUS GND | ☐ |
| 18 | MAX98357-R DIN | ESP32 GPIO 25 | ☐ |
| 19 | MAX98357-R BCLK | ESP32 GPIO 26 | ☐ |
| 20 | MAX98357-R LRC | ESP32 GPIO 27 | ☐ |
| — | MAX98357-R SD | (SIN CONEXIÓN) | — |
| — | MAX98357-R GAIN | (SIN CONEXIÓN) | — |

**⚠️ SD sin conectar = Canal DERECHO (default)**

**Nota:** Ambos MAX98357 comparten GPIO 25/26/27 (bus I2S)

---

## ■ CONEXIONES - LCD 16x2 I2C

| # | DESDE | HACIA | ✓ |
|---|-------|-------|---|
| 21 | LCD VCC | BUS 5V | ☐ |
| 22 | LCD GND | BUS GND | ☐ |
| 23 | LCD SDA | ESP32 GPIO 21 | ☐ |
| 24 | LCD SCL | ESP32 GPIO 22 | ☐ |

**⚠️ Verificar dirección I2C: 0x27 (común) o 0x3F**

---

## ■ CONEXIONES - PARLANTES (Estéreo)

| # | DESDE | HACIA | ✓ |
|---|-------|-------|---|
| 25 | MAX98357-L Speaker+ | Parlante LEFT (+) | ☐ |
| 26 | MAX98357-L Speaker- | Parlante LEFT (-) | ☐ |
| 27 | MAX98357-R Speaker+ | Parlante RIGHT (+) | ☐ |
| 28 | MAX98357-R Speaker- | Parlante RIGHT (-) | ☐ |

**⚠️ NO conectar parlantes a GND común. Usar salida diferencial de cada MAX98357**

---

## ■ CONEXIONES - BATERÍA (opcional)

| # | DESDE | HACIA | ✓ |
|---|-------|-------|---|
| 29 | VBAT+ | R1 (100kΩ) | ☐ |
| 30 | R1 ↔ R2 | ESP32 GPIO 34 | ☐ |
| 31 | R2 (100kΩ) | GND | ☐ |

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

## ■ CONFIG. MAX98357 (Estéreo)

| MÓDULO | PIN SD | CANAL |
|--------|--------|-------|
| MAX98357-L | GND vía 1MΩ | Izquierdo (LEFT) |
| MAX98357-R | Sin conectar | Derecho (RIGHT) |

| PIN | ESTADO | EFECTO |
|-----|--------|--------|
| GAIN | Sin conectar | 9dB ganancia (ambos) |

---

## ■ CHECKLIST POST-SOLDADURA

- [ ] Continuidad de GND en todos los módulos
- [ ] Sin cortocircuito entre 5V y GND
- [ ] Voltaje en ESP32 VIN = 5.0V ± 0.1V
- [ ] Voltaje en MAX98357-L VIN = 5.0V ± 0.1V
- [ ] Voltaje en MAX98357-R VIN = 5.0V ± 0.1V
- [ ] Voltaje en LCD VCC = 5.0V ± 0.1V
- [ ] LCD enciende backlight al alimentar
- [ ] ESP32 arranca (LED onboard parpadea)
- [ ] WiFi AP visible: "HIOS-Speaker"
- [ ] Audio LEFT sale por parlante izquierdo
- [ ] Audio RIGHT sale por parlante derecho
- [ ] LCD muestra información (modo, volumen)

---

## ■ SOLUCIÓN DE PROBLEMAS

| PROBLEMA | CAUSA PROBABLE | SOLUCIÓN |
|----------|----------------|----------|
| Sin audio en ningún canal | LRC en pin incorrecto | Verificar GPIO27 → LRC de ambos |
| Solo canal derecho | SD del LEFT mal conectado | Verificar R 1MΩ entre SD y GND |
| Solo canal izquierdo | SD del RIGHT conectado a algo | Dejar SD sin conectar |
| Ambos suenan igual (mono) | Ambos SD sin conectar | Agregar R 1MΩ al LEFT |
| Audio distorsionado | Voltaje bajo | Verificar 5V estable |
| LCD no enciende | Dirección I2C | Probar 0x27 y 0x3F |
| LCD en blanco | Contraste | Ajustar potenciómetro trasero |
| ESP32 no arranca | Voltaje alto/bajo | Verificar DC-DC = 5.0V |
| WiFi no visible | Firmware no cargado | Flashear firmware |

---

## ■ LISTA RÁPIDA - TODAS LAS CONEXIONES

```
#   DESDE                  →  HACIA
─────────────────────────────────────────────────────────
    ALIMENTACIÓN
1   BAT1 (+)               →  Cargador B+
2   BAT2 (-)               →  Cargador B-
3   BAT1(-) / BAT2(+)      →  Cargador BM
4   Cargador P+            →  DC-DC IN+
5   Cargador P-            →  DC-DC IN-
6   DC-DC OUT+             →  BUS 5V
7   DC-DC OUT-             →  BUS GND
─────────────────────────────────────────────────────────
    ESP32
8   ESP32 VIN              →  BUS 5V
9   ESP32 GND              →  BUS GND
─────────────────────────────────────────────────────────
    MAX98357-L (LEFT)
10  MAX98357-L VIN         →  BUS 5V
11  MAX98357-L GND         →  BUS GND
12  MAX98357-L DIN         →  ESP32 GPIO 25
13  MAX98357-L BCLK        →  ESP32 GPIO 26
14  MAX98357-L LRC         →  ESP32 GPIO 27
15  MAX98357-L SD          →  GND vía R 1MΩ
─────────────────────────────────────────────────────────
    MAX98357-R (RIGHT)
16  MAX98357-R VIN         →  BUS 5V
17  MAX98357-R GND         →  BUS GND
18  MAX98357-R DIN         →  ESP32 GPIO 25
19  MAX98357-R BCLK        →  ESP32 GPIO 26
20  MAX98357-R LRC         →  ESP32 GPIO 27
─────────────────────────────────────────────────────────
    LCD 16x2
21  LCD VCC                →  BUS 5V
22  LCD GND                →  BUS GND
23  LCD SDA                →  ESP32 GPIO 21
24  LCD SCL                →  ESP32 GPIO 22
─────────────────────────────────────────────────────────
    PARLANTES
25  MAX98357-L Speaker+    →  Parlante LEFT (+)
26  MAX98357-L Speaker-    →  Parlante LEFT (-)
27  MAX98357-R Speaker+    →  Parlante RIGHT (+)
28  MAX98357-R Speaker-    →  Parlante RIGHT (-)
─────────────────────────────────────────────────────────
    BATERÍA (opcional)
29  VBAT+                  →  R1 (100kΩ)
30  R1 ↔ R2                →  ESP32 GPIO 34
31  R2 (100kΩ)             →  GND
─────────────────────────────────────────────────────────
```

---

**HIOS WiFi Speaker v3.0 (Estéreo) | HI Open Systems | Total: 31 conexiones**
