# HIOS BTDAC - Troubleshooting Audio

## El Problema
- BT conecta ✓
- LED funciona ✓
- Se escucha ruido/fritura al conectar
- NO se escucha la música

## Diagnóstico Paso a Paso

### PASO 1: Probar código minimalista
Flasheá `HIOS_BTDAC_minimal_test.ino` primero.
- Si funciona → el problema era la config I2S, usá el código completo v2
- Si NO funciona → seguí al paso 2

### PASO 2: Verificar jumpers PCM5102 (MUY IMPORTANTE)

```
Parte trasera del módulo:

  FLT   DEMP   XSMT   FMT
  [L]   [L]    [H]    [L]
   ●     ●      ●      ●
   │     │      │      │
   L     L      H      L

CRÍTICO: XSMT debe estar en H (High) para que haya sonido
```

### PASO 3: Verificar SCK a GND
El pin SCK del PCM5102 DEBE estar conectado a GND.
- Medí continuidad entre SCK y GND con multímetro
- Debe dar ~0Ω

### PASO 4: Verificar conexiones I2S
Con multímetro en modo continuidad:

| ESP32 GPIO | PCM5102 Pin | Debe dar |
|------------|-------------|----------|
| 26         | BCK         | ~0Ω      |
| 25         | LRCK        | ~0Ω      |
| 22         | DIN         | ~0Ω      |
| GND        | GND         | ~0Ω      |
| GND        | SCK         | ~0Ω      |

### PASO 5: Medir señales con multímetro (modo DC)
Con el ESP32 encendido y BT conectado:

| Pin     | Voltaje esperado |
|---------|------------------|
| BCK     | ~1.5V DC (oscilando) |
| LRCK    | ~1.5V DC (oscilando) |
| DIN     | ~1.5V DC (oscilando) |

Si todos dan 0V → el I2S no está transmitiendo
Si dan 3.3V fijo → hay un problema de configuración

### PASO 6: Verificar alimentación
- PCM5102 VIN debe tener 5V estables
- Si el voltaje cae al reproducir → el step-down no da suficiente corriente

## Causas Comunes del "Ruido de Fritura"

1. **SCK no conectado a GND** - El DAC no genera su clock interno
2. **XSMT en L** - El DAC está en mute
3. **FMT incorrecto** - Formato de audio no coincide
4. **Cables I2S muy largos** - Interferencia, usar cables < 10cm
5. **GND no es común** - El GND del ESP32 y PCM5102 deben estar unidos

## Código de Prueba con Debug I2S

Si nada funciona, agregá esto al setup() para ver si I2S está activo:

```cpp
// Después de a2dp_sink.start()
Serial.println("Verificando I2S...");
Serial.printf("BCK pin: %d\n", 26);
Serial.printf("LRCK pin: %d\n", 25);
Serial.printf("DOUT pin: %d\n", 22);
```

## Links Útiles

- [ESP32-A2DP Wiki](https://github.com/pschatzmann/ESP32-A2DP/wiki)
- [PCM5102 Datasheet](https://www.ti.com/lit/ds/symlink/pcm5102.pdf)
