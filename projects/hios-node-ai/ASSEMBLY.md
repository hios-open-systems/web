# HIOS Node AI — Guía de Ensamblaje Paso a Paso

Esta guía describe el procedimiento de armado, soldadura y verificación de componentes para el nodo HIOS AI.

---

## Herramientas Necesarias

- Soldador de estaño (temperatura regulable ~350°C).
- Estaño con alma de resina 60/40 o 99/1 (lead-free).
- Malla desoldadora y flux en pasta/pen.
- Alicate de corte al ras.
- Multímetro digital con continuidad acústica.
- Cable de prototipado AWG24 o AWG26.

---

## Pasos de Armado

Probá cada paso antes de pasar al siguiente. La checklist completa está en [`hardware/README.md`](hardware/README.md).

### Paso 1: Energía, sin nada más conectado
1. Celda 18650 en el portapilas → **B+ / B−** del TP4056 (con protección). Medí polaridad antes de soldar.
2. **OUT+** del TP4056 → **SW1** → **VIN** del Pololu U3V40F5. **OUT−** → GND.
3. Resistencia de **22kΩ** entre **EN** y **GND** del U3V40F5 (corta a ≈3.06V y protege la celda).
4. Encendé SW1 y medí **5.0V ±4%** en VOUT. No conectes nada más hasta tener esa lectura.

### Paso 2: DevKit y medición de batería
1. Soldá los headers a la ESP32-S3-DevKitC-1.
2. VOUT del boost → **ánodo del SS34**; **cátodo** (la raya) → pin **5V** del DevKit (J1 pin 21). GND → G.
3. Divisor: OUT+ (después de SW1) → 100kΩ → **GPIO1** → 100kΩ → GND, y 100nF de GPIO1 a GND.
4. Encendé: el DevKit arranca y GPIO1 mide la mitad de la batería (≤2.1V).

### Paso 3: Pantalla OLED
`VCC` → 3V3, `GND`, `SDA` → **GPIO 8**, `SCL` → **GPIO 9**. Verificá la dirección 0x3C con un escáner I2C.

### Paso 4: Amplificador MAX98357A y parlante
1. `VIN` → **5V del boost** (antes del diodo) con un 220µF a GND pegado al módulo. `GND` a masa.
2. `BCLK` → GPIO 15, `LRC` → GPIO 16, `DIN` → GPIO 17. `GAIN` → GND (12 dB), `SD` → VIN.
3. Parlante de 4Ω 3W entre `OUT+` y `OUT−`. Ningún borne a GND. Al arrancar, el firmware emite un beep.

### Paso 5: Micrófono INMP441
1. `VDD` → **3V3** (nunca 5V), `GND`, `L/R` → GND.
2. `SCK` → GPIO 42, `WS` → GPIO 41, `SD` → GPIO 40. El firmware todavía no lo lee: queda listo para la entrada por voz.

### Paso 6: Botón y LED
Pulsador entre **GPIO 4** y GND. LED: **GPIO 2** → 330Ω → ánodo; cátodo → GND.

### Paso 7: Verificación eléctrica
Con SW1 apagado y sin USB, en modo continuidad: sin pitido entre `5V`–`GND`, `3V3`–`GND` y `BAT`–`GND`.

### Flasheo
Configurá WiFi y servidor en `platformio.ini` (`build_flags`) sin commitear tus credenciales y corré `pio run -t upload`. Podés dejar SW1 encendido: el SS34 evita que el USB alimente el boost.
