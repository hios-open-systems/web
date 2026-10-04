# HIOS WiFi Speaker

Parlante WiFi + Bluetooth con ESP32: **2× amplificador I2S MAX98357 en estéreo**, display LCD 16×2 y batería 2S recargable por USB-C. Reproduce radios WiFi, audio de YouTube (vía Invidious) y actúa como sink Bluetooth A2DP, con control por interfaz web.

## Primeros pasos

```bash
cd projects/speaker
pio run -t upload             # compilar y flashear (PlatformIO)
pio device monitor -b 115200  # monitor serial
```

Ya en la red: **http://hios-speaker.local**.

## Modos de reproducción

El firmware incluye estos modos (enum `Mode` en `src/main.ino`):

- **WiFi Radio** — emisoras preconfiguradas o una URL de audio.
- **YouTube** — audio de YouTube mediante la API de Invidious; depende de la disponibilidad y compatibilidad de la instancia utilizada.
- **Bluetooth A2DP** — recibe audio desde un teléfono o una computadora.
- **Config por BT serial** — configurás la red WiFi desde una terminal Bluetooth, sin recompilar.

Todo sale por I2S a los dos MAX98357 (un amplificador por canal). El LCD muestra modo, volumen y título.

## Cableado

La hoja verificada contra el firmware es la guía **[/pinouts/speaker](https://openhios.dev/pinouts/speaker)** (se auto-verifica contra `src/main.ino` en cada `npm run test:wiring`). Resumen:

| Bus | ESP32 | A |
|---|---|---|
| I2S DIN | GPIO25 | DIN de **ambos** MAX98357 (bus compartido) |
| I2S BCLK | GPIO26 | BCLK de ambos |
| I2S LRC | GPIO27 | LRC de ambos |
| I2C SDA / SCL | GPIO21 / GPIO22 | LCD 16×2 (0x27) |
| VBAT | GPIO34 | divisor 100k/100k del pack (IO34 es input-only) |
| 5V / GND | VIN / GND | del LM2596 (buck a 5.0V) |

> **Selección de canal L/R:** el bus I2S es compartido; cada amplificador selecciona su canal mediante SD. Verificá la tensión de ese pin y contrastala con la ficha del módulo. Consultá el paso de medición de SD en la guía de conexiones.

## Componentes (BOM)

Estéreo, pack 2S:

| Componente | Función | Selección del módulo |
|---|---|---|
| ESP32 DevKit (WROOM-32) | Control, WiFi y Bluetooth | Red WiFi de 2.4GHz |
| **2×** MAX98357 | Amplificación I2S, un módulo por canal | Verificá alimentación, carga y selección de canal en la ficha del módulo |
| **2×** parlante | Salida izquierda y derecha | Seleccioná impedancia y potencia compatibles con los amplificadores |
| LCD 16×2 + adaptador I2C | Estado, volumen y título | Dirección configurada en el firmware: 0x27 |
| LM2596S con display | Regulación de alimentación | Salida ajustada a 5.0V; capacidad según módulo y disipación |
| Cargador y protección 2S USB-C | Carga del pack | Verificá compatibilidad con las celdas y requisitos de entrada |
| **2×** 18650 en serie | Batería 2S | Usá un portapilas con configuración serie verificada |
| Resistencias | Divisor de VBAT y selección de canal SD | Consultá la guía de conexiones y validá las tensiones antes de conectar |

No hay mediciones publicadas de potencia, consumo o autonomía del montaje completo.

## Secuencia de armado

Cada fase se prueba antes de pasar a la siguiente:

1. **Energía primero.** Cargá el pack 2S, conectá al LM2596 y **ajustá el buck a 5.0V con el multímetro. NO conectes nada más hasta tener 5V estables.**
2. **ESP32** — OUT+ del buck → VIN, OUT− → GND. Probá un Blink por USB.
3. **Amplis (×2)** — Vin→5V, GND→masa común, bus I2S (25/26/27) a los dos. Parlante 4–8Ω directo a la salida de cada ampli (class-D filterless, sin filtro).
4. **LCD** — VCC→5V, GND, SDA=21 / SCL=22.
5. **Firmware** — `tests/test_basic.ino` (debe dar un tono) → después `src/main.ino`.

## Banco de pruebas previo al montaje

Para validar hardware/cableado/estabilidad antes del montaje final, consultá:

- `testbench/README.md`
- `testbench/PINOUT.md`
- `testbench/VALIDATION_PLAN.md`
- `testbench/CHECKLIST_PRE_MONTAJE.md`
- `testbench/firmware/` (smoke, L/R, estéreo estabilidad)
- `testbench/results/logs/LOG_TEMPLATE.md`

**Antes de conectar los módulos:** con la alimentación desconectada, comprobá continuidad entre las masas y ausencia de cortocircuitos. Verificá por separado que el regulador entregue 5.0V. Las fotos de referencia están en `pics/build/` y `pics/modules/`.

## Diagnóstico

- **Reinicios al usar WiFi:** revisá la alimentación, los cables y los mensajes del monitor serial para identificar posibles caídas de tensión.
- **Ruido:** comprobá masa común, alimentación y conexiones I2S. Seguí las recomendaciones de desacople del módulo utilizado.
- **Distorsión:** probá con menor volumen y verificá que la alimentación se mantenga estable durante la reproducción.
- **Un solo canal:** medí la tensión de SD en cada amplificador y contrastala con su ficha técnica.
- **WiFi sin conexión:** verificá las credenciales y que la red opere en 2.4GHz.

## Estado

En desarrollo — prototipo funcional. El código incluye WiFi radio, YouTube/Invidious, BT A2DP, config por BT serial, LCD y lectura de VBAT. Pendiente: diseño de una PCB propia.

## Licencia

Consultá las condiciones de licencia de cada dependencia antes de redistribuirla. Este directorio no incluye un archivo de licencia propio.

---

_HIOS — HI Open Systems · [openhios.dev/projects/speaker](https://openhios.dev/projects/speaker)_
