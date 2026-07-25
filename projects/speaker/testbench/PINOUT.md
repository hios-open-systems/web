# PINOUT — ESP32 + 2× MAX98357A (Stereo)

## Bus compartido I2S

| Señal | ESP32 | MAX98357A L | MAX98357A R |
|---|---|---|---|
| DIN | GPIO25 | DIN | DIN |
| BCLK | GPIO26 | BCLK | BCLK |
| LRC/WS | GPIO27 | LRC | LRC |
| GND | GND | GND | GND |
| 5V | VIN/5V | VIN | VIN |

> DIN/BCLK/LRC son compartidos para ambos amplificadores.

## Selección de canal por SD

La selección Left/Right depende del estado de **SD** de cada módulo (puede variar entre clones). Validar con multímetro y prueba audible:

- Módulo A: configurar y medir SD, luego confirmar con `02_channel_check_lr.ino`.
- Módulo B: configurar SD para el canal opuesto y volver a confirmar.

## Conexión de parlantes

- Parlante izquierdo al módulo configurado como Left.
- Parlante derecho al módulo configurado como Right.
- No compartir salidas de potencia entre módulos.

## Checklist eléctrico mínimo

- Masa común única entre ESP32 y ambos MAX98357A.
- Sin cortocircuito entre 5V y GND antes de energizar.
- Tensión en 5V dentro de ±5% bajo carga.
