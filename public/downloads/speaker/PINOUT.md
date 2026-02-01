# Pinout - HIOS WiFi Speaker

Guia de conexiones del proyecto. Hub de audio WiFi + Bluetooth con display LCD.

---

## ESP32 - Conexiones principales

```
                    ┌─────────────────┐
                    │     ESP32       │
                    │    DevKit V1    │
                    ├─────────────────┤
              3.3V ─┤ 3V3         VIN ├─ 5V (desde LM2596)
               GND ─┤ GND         GND ├─ GND
                    │                 │
    (MAX98357 DIN) ─┤ GPIO25   GPIO26 ├─ (MAX98357 BCLK)
                    │                 │
   (MAX98357 LRC) ──┤ GPIO27   GPIO23 ├─ (Libre)
                    │                 │
       (LCD SDA) ───┤ GPIO21   GPIO22 ├─── (LCD SCL)
                    │                 │
           (Libre) ─┤ GPIO18   GPIO19 ├─ (Libre)
                    │                 │
      (VBAT ADC) ───┤ GPIO34   GPIO05 ├─ (Libre)
                    │                 │
                    └─────────────────┘
```

---

## Tabla de conexiones

### Alimentacion

| Origen | Destino | Cable | Notas |
|--------|---------|-------|-------|
| Bateria + | Cargador B+ | Rojo | Positivo baterias |
| Bateria - | Cargador B- | Negro | Negativo baterias |
| Cargador P+ | LM2596 IN+ | Rojo | Salida protegida |
| Cargador P- | LM2596 IN- | Negro | |
| LM2596 OUT+ | ESP32 VIN | Rojo | **Ajustar a 5V primero!** |
| LM2596 OUT- | ESP32 GND | Negro | |
| LM2596 OUT+ | MAX98357 VIN | Rojo | 5V |
| LM2596 OUT- | MAX98357 GND | Negro | |

### Audio I2S

| ESP32 | MAX98357 | Funcion |
|-------|----------|---------|
| GPIO25 | DIN | Data (audio digital) |
| GPIO26 | BCLK | Bit Clock |
| GPIO27 | LRC | Left/Right Clock (Word Select) |

### Display LCD 16x2 I2C

| ESP32 | LCD I2C | Funcion |
|-------|---------|---------|
| GPIO21 | SDA | I2C Data |
| GPIO22 | SCL | I2C Clock |
| 5V | VCC | Alimentacion |
| GND | GND | Tierra |

**Nota:** Direccion I2C tipica del modulo: `0x27` o `0x3F`

### Medicion Bateria (opcional)

| ESP32 | Componente | Funcion |
|-------|------------|---------|
| GPIO34 | Divisor resistivo | Voltaje bateria (ADC) |

**Circuito divisor resistivo:**
```
VBAT (7.4V) ───┬─── R1 (100kΩ) ───┬─── R2 (100kΩ) ───┬─── GND
               │                   │                   │
               │                   └─── GPIO34         │
               │                        (max 3.3V)     │
               └───────────────────────────────────────┘
```
**Nota:** Con R1=R2=100kΩ, el voltaje en GPIO34 = VBAT / 2.
Rango: 3.0V (baterias vacias) a 4.2V (llenas) en el ADC.

### Parlante

| MAX98357 | Parlante | Notas |
|----------|----------|-------|
| + (Speaker+) | + | Cable rojo |
| - (Speaker-) | - | Cable negro |

---

## Procedimiento de conexion

### Paso 1: Preparar fuente LM2596

**IMPORTANTE: Ajustar voltaje ANTES de conectar!**

1. Conectar bateria cargada al LM2596
2. Sin carga conectada, ajustar preset hasta leer 5.0V en display
3. Verificar con multimetro si es posible

### Paso 2: Conectar ESP32

1. Conectar VIN del ESP32 a salida LM2596
2. Conectar GND
3. Verificar que ESP32 enciende (LED)

### Paso 3: Conectar MAX98357

1. Conectar alimentacion (VIN, GND) desde LM2596
2. Conectar lineas I2S al ESP32:
   - DIN -> GPIO25
   - BCLK -> GPIO26
   - LRC -> GPIO27

### Paso 4: Conectar parlante

1. Conectar cables del parlante a salida del MAX98357
2. **Polaridad no importa** para audio (pero mantener consistencia)

### Paso 5: Conectar baterias y cargador

1. Conectar baterias al cargador (B+, B-)
2. Conectar salida protegida (P+, P-) al LM2596

---

## Diagrama visual

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│  BATERIAS   │      │  CARGADOR   │      │   LM2596    │
│  2x 18650   │──────│   USB-C     │──────│   5V OUT    │
│   7.4V      │ B+B- │    2S       │ P+P- │  c/Display  │
└──────┬──────┘      └─────────────┘      └──────┬──────┘
       │                                          │
       │ (opcional)                     5V ───────┼────────────┐
       │                                          │            │
       ▼                                   ┌──────┴──────┐     │
  ┌─────────┐                              │    ESP32    │     │
  │ DIVISOR │                              │             │     │
  │100k/100k├─────────────────────────────►│ GPIO34      │     │
  └─────────┘                              │             │     │
                                           │ GPIO25 ─────┼─────┼──┐
                                           │ GPIO26 ─────┼─────┼──┼──┐
                                           │ GPIO22 ─────┼─────┼──┼──┼──┐
                                           └─────────────┘     │  │  │  │
                                                               │  │  │  │
                                           ┌───────────────────┴──┴──┴──┴─┐
                                           │         MAX98357             │
                                           │   VIN GND DIN BCLK LRC       │
                                           │            │                 │
                                           │         Speaker +/-          │
                                           └────────────┼─────────────────┘
                                                        │
                                                   ┌────┴────┐
                                                   │ PARLANTE│
                                                   │ 4Ω  3W  │
                                                   └─────────┘
```

---

## Notas de seguridad

1. **Nunca conectar baterias invertidas** - El cargador tiene proteccion pero mejor no arriesgar
2. **Ajustar LM2596 antes de conectar ESP32** - Voltaje alto puede quemar el micro
3. **No cortocircuitar salida del MAX98357** - Tiene proteccion termica pero se calienta
4. **Usar baterias protegidas** - Las 18650 sin proteccion pueden ser peligrosas
5. **Desconectar bateria para hacer cambios** - No soldar con bateria conectada
