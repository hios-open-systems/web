### Conexiones Planas (para seguir al soldar)

```
═══════════════════════════════════════════════════════════════
                    ALIMENTACIÓN
═══════════════════════════════════════════════════════════════
BAT1-POS ─────────────────────────────────────────────► BMS-B+
BAT2-NEG ─────────────────────────────────────────────► BMS-B-
BAT1-NEG / BAT2-POS ──────────────────────────────────► BMS-BM
BMS-P+ ───────────────────────────────────────────────► DCDC-IN+
BMS-P- ───────────────────────────────────────────────► DCDC-IN-
DCDC-OUT+ ────────────────────────────────────────────► BUS-5V
DCDC-OUT- ────────────────────────────────────────────► BUS-GND

═══════════════════════════════════════════════════════════════
                    ESP32
═══════════════════════════════════════════════════════════════
ESP32-VIN ────────────────────────────────────────────► BUS-5V
ESP32-GND ────────────────────────────────────────────► BUS-GND
ESP32-GPIO26 ─────────────────────────────────────────► PCM-BCK
ESP32-GPIO25 ─────────────────────────────────────────► PCM-LRCK
ESP32-GPIO22 ─────────────────────────────────────────► PCM-DIN
ESP32-GPIO4 ──────────────────────────────────────────► R330-A (LED Rojo)
ESP32-GPIO16 ─────────────────────────────────────────► R330-B (LED Verde)
ESP32-GPIO17 ─────────────────────────────────────────► R330-C (LED Azul)

═══════════════════════════════════════════════════════════════
                    PCM5102
═══════════════════════════════════════════════════════════════
PCM-VIN ──────────────────────────────────────────────► BUS-5V
PCM-GND ──────────────────────────────────────────────► BUS-GND
PCM-SCK ──────────────────────────────────────────────► BUS-GND
PCM-BCK ──────────────────────────────────────────────► ESP32-GPIO26
PCM-LRCK ─────────────────────────────────────────────► ESP32-GPIO25
PCM-DIN ──────────────────────────────────────────────► ESP32-GPIO22
PCM-3.3V ─────────────────────────────────────────────► (SIN CONEXIÓN)

═══════════════════════════════════════════════════════════════
                    LED RGB (KY-009)
═══════════════════════════════════════════════════════════════
LED-GND (cátodo) ─────────────────────────────────────► BUS-GND
LED-R ────────────────────────────────────────────────► R330-A (otro extremo)
LED-G ────────────────────────────────────────────────► R330-B (otro extremo)
LED-B ────────────────────────────────────────────────► R330-C (otro extremo)

═══════════════════════════════════════════════════════════════
                    RESISTENCIAS (330Ω)
═══════════════════════════════════════════════════════════════
R330-A: ESP32-GPIO4  ◄────[330Ω]────► LED-R
R330-B: ESP32-GPIO16 ◄────[330Ω]────► LED-G
R330-C: ESP32-GPIO17 ◄────[330Ω]────► LED-B

═══════════════════════════════════════════════════════════════
                    CAPACITORES (Opcional pero recomendado)
═══════════════════════════════════════════════════════════════
C1-100µF: BUS-5V ◄────[100µF]────► BUS-GND  (cerca ESP32)
C2-100nF: BUS-5V ◄────[100nF]────► BUS-GND  (cerca ESP32)
C3-10µF:  BUS-5V ◄────[10µF]─────► BUS-GND  (cerca PCM5102)
C4-100nF: BUS-5V ◄────[100nF]────► BUS-GND  (cerca PCM5102)
```

### Tabla Resumen de Conexiones (Ordenada por Destino)

| #   | Desde         | Hacia          | Tipo     | Verificado |
| :-- | :------------ | :------------- | :------- | :--------- |
| 1   | BAT1+         | BMS B+         | Potencia | ☐          |
| 2   | BAT2-         | BMS B-         | Potencia | ☐          |
| 3   | BAT1- / BAT2+ | BMS BM         | Balance  | ☐          |
| 4   | BMS P+        | DC-DC IN+      | Potencia | ☐          |
| 5   | BMS P-        | DC-DC IN-      | Potencia | ☐          |
| 6   | DC-DC OUT+    | BUS 5V         | Potencia | ☐          |
| 7   | DC-DC OUT-    | BUS GND        | Potencia | ☐          |
| 8   | BUS 5V        | ESP32 VIN      | Potencia | ☐          |
| 9   | BUS GND       | ESP32 GND      | Potencia | ☐          |
| 10  | BUS 5V        | PCM5102 VIN    | Potencia | ☐          |
| 11  | BUS GND       | PCM5102 GND    | Potencia | ☐          |
| 12  | BUS GND       | PCM5102 SCK    | Señal    | ☐          |
| 13  | ESP32 GPIO26  | PCM5102 BCK    | I2S      | ☐          |
| 14  | ESP32 GPIO25  | PCM5102 LRCK   | I2S      | ☐          |
| 15  | ESP32 GPIO22  | PCM5102 DIN    | I2S      | ☐          |
| 16  | BUS GND       | LED (-) Cátodo | LED      | ☐          |
| 17  | ESP32 GPIO4   | R330 → LED R   | LED      | ☐          |
| 18  | ESP32 GPIO16  | R330 → LED G   | LED      | ☐          |
| 19  | ESP32 GPIO17  | R330 → LED B   | LED      | ☐          |

**Total: 19 conexiones principales**

---

## Checklist Pre-Soldadura

- [ ] DC-DC ajustado a 5.0V (medir con multímetro)
- [ ] Jumpers del PCM5102 configurados (FLT-L, DEMP-L, XSMT-H, FMT-L)
- [ ] Resistencias 330Ω verificadas (medir con multímetro)
- [ ] Polaridad de baterías verificada
- [ ] Celdas 18650 con voltaje similar (diferencia < 0.1V)

## Checklist Post-Soldadura

- [ ] Continuidad de GND en todos los módulos
- [ ] Sin cortocircuito entre 5V y GND
- [ ] Voltaje en ESP32 VIN = 5.0V ± 0.1V
- [ ] Voltaje en PCM5102 VIN = 5.0V ± 0.1V
- [ ] LED enciende en cada color individualmente
- [ ] ESP32 arranca (LED onboard parpadea)

---
