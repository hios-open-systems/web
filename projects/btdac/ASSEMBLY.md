# Guia de Ensamblaje - HIOS BTDAC

Instrucciones paso a paso para armar el receptor Bluetooth DAC.

---

## Herramientas necesarias

- Soldador (punta fina recomendada)
- Estano 60/40 o sin plomo
- Pinzas
- Pelacables
- Multimetro
- Pistola de silicona (opcional)

---

## Orden de ensamblaje

### Fase 1: Preparar fuente de alimentacion

**Objetivo:** Tener 5V estables antes de conectar electronica.

1. **Conectar baterias al BMS 2S**
   - B+ al positivo de la bateria 1
   - B- al negativo de la bateria 2
   - BM al punto medio (entre las dos baterias)

2. **Conectar BMS al LM2596**
   - P+ del BMS → IN+ del LM2596
   - P- del BMS → IN- del LM2596

3. **Ajustar voltaje de salida**
   - Conectar baterias cargadas
   - Girar preset hasta leer 5.0V
   - **CRITICO: NO conectar nada mas hasta tener 5V estables**

### Fase 2: Configurar PCM5102

4. **Configurar jumpers (parte trasera)**
   ```
   FLT  → L (Low)
   DEMP → L (Low)
   XSMT → H (High)  ← IMPORTANTE: Unmute
   FMT  → L (Low)
   ```

5. **Puente SCK a GND**
   - Conectar pin SCK directamente a GND
   - Esto activa el PLL interno

### Fase 3: Conectar ESP32

6. **Alimentar ESP32**
   - LM2596 OUT+ → ESP32 VIN
   - LM2596 OUT- → ESP32 GND
   - Verificar que el LED del ESP32 enciende

7. **Conectar I2S al PCM5102**
   - GPIO26 → BCK
   - GPIO25 → LRCK
   - GPIO22 → DIN

### Fase 4: Conectar LED RGB

8. **Preparar resistencias**
   - 3x resistencias de 330Ω
   - Soldar en serie con cada color

9. **Conectar KY-009**
   - GPIO4 → 330Ω → LED R
   - GPIO16 → 330Ω → LED G
   - GPIO17 → 330Ω → LED B
   - LED (-) → GND

### Fase 5: Alimentar PCM5102

10. **Conectar alimentacion del DAC**
    - LM2596 OUT+ → PCM5102 VIN
    - GND → PCM5102 GND
    - GND → PCM5102 SCK

---

## Diagrama de conexiones

```
═══════════════════════════════════════════════════════════════
                    ALIMENTACION
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
ESP32-GPIO4 ──────────────────────────────────────────► R330 → LED R
ESP32-GPIO16 ─────────────────────────────────────────► R330 → LED G
ESP32-GPIO17 ─────────────────────────────────────────► R330 → LED B

═══════════════════════════════════════════════════════════════
                    PCM5102
═══════════════════════════════════════════════════════════════
PCM-VIN ──────────────────────────────────────────────► BUS-5V
PCM-GND ──────────────────────────────────────────────► BUS-GND
PCM-SCK ──────────────────────────────────────────────► BUS-GND
PCM-BCK ──────────────────────────────────────────────► ESP32-GPIO26
PCM-LRCK ─────────────────────────────────────────────► ESP32-GPIO25
PCM-DIN ──────────────────────────────────────────────► ESP32-GPIO22
PCM-3.3V ─────────────────────────────────────────────► (SIN CONEXION)

═══════════════════════════════════════════════════════════════
                    LED RGB (KY-009)
═══════════════════════════════════════════════════════════════
LED-GND (catodo) ─────────────────────────────────────► BUS-GND
R330-A: ESP32-GPIO4  ◄────[330Ω]────► LED-R
R330-B: ESP32-GPIO16 ◄────[330Ω]────► LED-G
R330-C: ESP32-GPIO17 ◄────[330Ω]────► LED-B
```

---

## Checklist Pre-Soldadura

- [ ] DC-DC ajustado a 5.0V (medir con multimetro)
- [ ] Jumpers del PCM5102 configurados (FLT-L, DEMP-L, XSMT-H, FMT-L)
- [ ] Resistencias 330Ω verificadas
- [ ] Polaridad de baterias verificada
- [ ] Celdas 18650 con voltaje similar (diferencia < 0.1V)

## Checklist Post-Soldadura

- [ ] Continuidad de GND en todos los modulos
- [ ] Sin cortocircuito entre 5V y GND
- [ ] Voltaje en ESP32 VIN = 5.0V ± 0.1V
- [ ] Voltaje en PCM5102 VIN = 5.0V ± 0.1V
- [ ] LED enciende en cada color individualmente
- [ ] ESP32 arranca (LED onboard parpadea)

---

## Capacitores recomendados

Para reducir ruido y mejorar calidad de audio:

| Ubicacion | Capacitor | Tipo |
|-----------|-----------|------|
| Cerca ESP32 VIN | 100µF | Electrolitico |
| Cerca ESP32 VIN | 100nF | Ceramico |
| Cerca PCM5102 VIN | 10µF | Electrolitico |
| Cerca PCM5102 VIN | 100nF | Ceramico |

---

## Fotos de referencia

Ver `/pics/build/` para fotos del proceso de armado.
Ver `/pics/modules/` para fotos de cada componente.
