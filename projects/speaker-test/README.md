# HIOS Speaker Test

Banco de pruebas para **escuchar los parlantes antes de armar el device**.

El ESP32 se hace pasar por un parlante Bluetooth. Emparejás el celular,
reproducís lo que quieras, y el audio sale en **estéreo** hacia dos
MAX98357A: uno como canal **izquierdo** y otro como **derecho**.

> Usá un **ESP32 clásico**, no el S3. El S3 sólo tiene BLE, no Bluetooth
> Classic (A2DP), así que no puede recibir audio del celu.

---

## Cableado

Los **dos** MAX98357A comparten el mismo bus I2S. Los tres pines de reloj/datos
van en paralelo a ambos amplificadores:

| ESP32        | MAX98357A (A y B) |
|--------------|-------------------|
| GPIO 26      | BCLK              |
| GPIO 25      | LRC               |
| GPIO 22      | DIN               |
| 5V (VIN)     | Vin               |
| GND          | GND               |

Cada parlante a la salida `+ / -` de su amplificador.

> Alimentá los amps desde **5V (VBUS/VIN)**, no desde 3V3. La señal I2S sí
> es de 3.3V, eso está bien.

---

## Elegir canal L / R (pin SD de cada amp)

Por defecto cada MAX98357A reproduce `(L+R)/2` (mono). Para separarlos,
el pin **SD** de cada amp define su canal según el voltaje que le pongas.
Como el chip tiene un pull-down interno de ~100 kΩ a GND, un resistor a **Vin**
sube ese voltaje:

| Voltaje en SD     | Canal        | Cómo lograrlo (resistor SD → Vin) |
|-------------------|--------------|-----------------------------------|
| > 1.4 V           | **Izquierdo**| **100 kΩ**                        |
| 0.77 V – 1.4 V    | **Derecho**  | **220 kΩ**                        |
| 0.16 V – 0.77 V   | (L+R)/2 mono | sin resistor (queda flotando)     |
| < 0.16 V          | apagado      | SD a GND                          |

Entonces:

- **Amp A (izquierdo):** 100 kΩ entre SD y Vin.
- **Amp B (derecho):** 220 kΩ entre SD y Vin.

> Los valores exactos dependen del breakout. Si al probar se escuchan cruzados
> o los dos igual, ajustá el resistor del canal derecho (subilo un poco).
> Para una prueba rápida podés dejar ambos SD sin resistor: los dos suenan en
> mono `(L+R)/2` y confirmás que los parlantes andan; después separás L/R.

---

## Flashear

Desde esta carpeta:

```bash
pio run -t upload      # compila y sube
pio device monitor     # ver el log (115200)
```

En el celular: Bluetooth → emparejar con **HIOS Speaker Test** → reproducir.

Para separar L/R en la prueba: mandá un test de balance/paneo (buscá
"stereo test left right" en YouTube) y confirmá que cada parlante suena
cuando corresponde.
