# Guia de Ensamblaje - HIOS WiFi Speaker

Instrucciones paso a paso para armar el proyecto.

---

## Herramientas necesarias

- Soldador (punta fina recomendada)
- Estano 60/40 o sin plomo
- Pinzas
- Pelacables
- Multimetro
- Pistola de silicona (opcional, para fijar)

---

## Orden de ensamblaje

### Fase 1: Preparar fuente de alimentacion

**Objetivo:** Tener 5V estables antes de conectar electronica.

1. **Conectar baterias al cargador**
   - B+ (rojo) al positivo de las baterias en serie
   - B- (negro) al negativo
   - Verificar LEDs del cargador

2. **Conectar cargador al LM2596**
   - P+ del cargador → IN+ del LM2596
   - P- del cargador → IN- del LM2596

3. **Ajustar voltaje de salida**
   - Conectar baterias cargadas
   - Girar preset hasta leer 5.0V en display
   - Verificar con multimetro
   - **NO conectar nada mas hasta tener 5V estables**

### Fase 2: Conectar ESP32

4. **Alimentar ESP32**
   - OUT+ del LM2596 → VIN del ESP32
   - OUT- del LM2596 → GND del ESP32
   - Verificar que el LED del ESP32 enciende

5. **Probar ESP32**
   - Conectar USB y subir un sketch basico (Blink)
   - Si funciona, desconectar USB

### Fase 3: Conectar amplificador

6. **Alimentar MAX98357**
   - VIN → 5V (desde LM2596, paralelo con ESP32)
   - GND → GND comun

7. **Conectar I2S**
   - DIN → GPIO25 del ESP32
   - BCLK → GPIO26 del ESP32
   - LRC → GPIO22 del ESP32

8. **Conectar parlante**
   - Speaker+ → salida + del MAX98357
   - Speaker- → salida - del MAX98357

### Fase 4: Prueba inicial

9. **Subir firmware de prueba**
   - Usar `tests/test_basic.ino`
   - Debe reproducir un tono

10. **Subir firmware completo**
    - Usar `src/main.ino`
    - Conectar via WiFi y probar audio

---

## Diagrama de conexiones

```
BATERIAS          CARGADOR           LM2596            ESP32
  (+)────────────(B+)
  (-)────────────(B-)    (P+)───────(IN+)
                         (P-)───────(IN-)  (OUT+)──────(VIN)
                                           (OUT-)──────(GND)
                                              │
                                              ├─────────(5V) MAX98357
                                              │         (GND)────(GND)
                                              │
                                              │  GPIO25────(DIN)
                                              │  GPIO26────(BCLK)
                                              │  GPIO22────(LRC)
                                              │
                                              │         (+)────PARLANTE────(-)
                                              │         │                   │
                                              └─────────┴───(Speaker+/-)────┘
```

---

## Tips de soldadura

### Antes de soldar

- Limpiar puntas de cables con alcohol
- Estañar puntas de cables primero
- Estañar pads de los modulos
- Usar flux si es necesario

### Durante la soldadura

- Temperatura: 350-380°C para estano con plomo, 380-400°C sin plomo
- Contacto rapido (2-3 segundos max)
- No mover hasta que solidifique

### Despues de soldar

- Inspeccionar visualmente cada union
- Verificar continuidad con multimetro
- Verificar que no hay cortocircuitos

---

## Verificaciones antes de encender

| Check | Metodo | Esperado |
|-------|--------|----------|
| Polaridad baterias | Visual | Rojo a +, Negro a - |
| Voltaje baterias | Multimetro | 7.0V - 8.4V |
| Voltaje LM2596 | Display | 5.0V |
| Continuidad GND | Multimetro | 0 ohm entre todos los GND |
| Sin cortocircuito | Multimetro | Infinito entre VIN y GND |

---

## Problemas comunes en ensamblaje

### ESP32 no enciende

1. Verificar voltaje en VIN (debe ser ~5V)
2. Verificar polaridad
3. Verificar soldaduras

### No hay audio

1. Verificar conexiones I2S
2. Verificar que parlante funciona (test con pila 1.5V)
3. Verificar alimentacion del MAX98357

### Ruido o distorsion

1. Acortar cables de I2S
2. Separar cables de audio de cables de alimentacion
3. Agregar capacitor 100uF en alimentacion del MAX98357

---

## Secuencia de encendido

1. Conectar baterias
2. Esperar que display muestre voltaje
3. Verificar LED del ESP32
4. Esperar conexion WiFi (ver Serial Monitor)
5. Probar audio

---

## Fotos de referencia

Ver `/pics/build/` para fotos del proceso de armado.
Ver `/pics/modules/` para fotos de cada componente.
