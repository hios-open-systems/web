---
title: "Modulación QPSK: fase en cuadratura, constelación y degradación OSNR"
date: "2026-10-17"
lang: "es"
summary: "Cómo funciona el mapeo Gray en cuadratura I/Q, qué significan los canales I(t) y Q(t), por qué los saltos de 180° cruzan por amplitud cero dando origen a OQPSK, y cómo el ruido AWGN dispara el Pre-FEC BER."
tags: ["dsp", "qpsk", "rf", "optica", "modulacion", "referencia"]
category: "referencia"
interactive: "qpsk-simulator"
---

La modulación **QPSK (Quadrature Phase Shift Keying)** transmite **2 bits por símbolo (dibit)** codificando la información en cuatro estados de fase separados por **90°**. En lugar de duplicar el ancho de banda para duplicar la tasa binaria respecto a BPSK, QPSK envía dos flujos de datos independientes sobre la misma frecuencia portadora aprovechando la **ortogonalidad trigonométrica** entre una onda coseno y una onda seno.

## ¿Qué significan los canales `I(t)`, `Q(t)` y `s(t)`?

En cualquier modulador o transceptor digital en cuadratura (SDR, Wi-Fi, DVB-S2, enlaces ópticos coherentes DP-QPSK), el flujo binario de entrada se divide en pares de bits (dibits `b₁b₀`) que alimentan dos ramas paralelas:

* **`I(t)` — Canal En Fase (*In-Phase*, CH1 amarillo):** Recibe los **bits pares (`b₁`)** de la trama y los convierte en niveles bipolares NRZ (`+1 V` para el bit `0`, `−1 V` para el bit `1`). Se llama *En Fase* porque multiplica a la portadora de referencia **`cos(ωc·t)`** (fase `0°`). En el diagrama de constelación **X-Y**, `I(t)` controla la posición sobre el **eje horizontal (X)**.
* **`Q(t)` — Canal En Cuadratura (*Quadrature*, CH2 cian):** Recibe los **bits impares (`b₀`)** de la trama (`+1 V` para `0`, `−1 V` para `1`). Se llama *En Cuadratura* porque multiplica a una portadora **`sin(ωc·t)`**, que está desplazada exactamente **90° (un cuarto de ciclo)** respecto al coseno. Como el seno y el coseno son **ortogonales** (su correlación promedio en un período de símbolo es cero), el receptor puede separar `I(t)` y `Q(t)` sin que se interfieran entre sí. En la constelación **X-Y**, `Q(t)` controla la posición sobre el **eje vertical (Y)**.
* **`s(t)` — Portadora Modulada (CH3 verde):** Es la señal física real de radiofrecuencia u óptica que sale al canal, resultante de sumar ambas componentes ortogonales.

## Ecuación en cuadratura y mapeo Gray

La señal transmitida durante cada período de símbolo `Ts` se expresa como la superposición ortogonal normalizada en energía:

```text
s(t) = (1 / √2) · [ I(t)·cos(ωc·t) − Q(t)·sin(ωc·t) ]
```

Para minimizar la tasa de error de bit (**BER**) frente al ruido térmico o de amplificación, los símbolos no se asignan en orden binario natural sino mediante **Codificación Gray**, donde dos cuadrantes vecinos difieren en **un único bit**:

| Dibit (`b₁b₀`) | Canal `I(t)` (Bit par, eje X) | Canal `Q(t)` (Bit impar, eje Y) | Fase resultante de `s(t)` | Cuadrante |
|---|---|---|---|---|
| `00` | `+1` | `+1` | **45°** (`π/4`) | I (arriba-derecha) |
| `01` | `−1` | `+1` | **135°** (`3π/4`) | II (arriba-izquierda) |
| `11` | `−1` | `−1` | **225°** (`5π/4`) | III (abajo-izquierda) |
| `10` | `+1` | `−1` | **315°** (`7π/4`) | IV (abajo-derecha) |

Si el ruido del canal desvía un símbolo hacia el cuadrante contiguo (error de fase de `±90°`), el receptor solo comete **1 error de bit** de los 2 transmitidos.

## Laboratorio interactivo: Osciloscopio y Constelación QPSK

Usá el instrumento digital de abajo para inspeccionar en tiempo real los canales digitales **`I(t)`** (CH1) y **`Q(t)`** (CH2), la portadora modulada **`s(t)`** (CH3) y el diagrama de constelación en **Modo X-Y**. Podés hacer clic o tocar directamente sobre cualquiera de las 6 columnas en la pantalla del osciloscopio o en los botones de secuencia para rotar el símbolo de cada ranura temporal:

<!-- interactive:qpsk-simulator -->

## Experimento 1: El salto de 180°, el cruce por `(0,0)` y por qué nació OQPSK

1. En el panel de control, presioná el botón **Forzar 180°** (que alterna `00` ↔ `11`) y luego presioná **PAUSAR / SINGLE SHOT**.
2. En la pantalla izquierda (dominio del tiempo), observá los **marcadores rojos** sobre la onda verde (**CH3**): justo en la frontera del símbolo, cuando la portadora venía subiendo, invierte su pendiente de forma instantánea respecto a la portadora gris de referencia (`0°`).
3. En la pantalla derecha (**Modo X-Y**), observá la línea celeste de transición vectorial entre `00 (45°)` y `11 (225°)`: **cruza exactamente por el origen `(0,0)`**.

Cuando ambos bits cambian al mismo tiempo (`I` y `Q` invierten su signo simultáneamente), la envolvente de la portadora colapsa momentáneamente a **amplitud cero** (modulación de amplitud del 100% durante la transición filtrada). En transmisores de radiofrecuencia con amplificadores de potencia operando cerca de la saturación (Clase AB/C) o en enlaces ópticos coherentes con no-linealidades de Kerr, esas fluctuaciones abruptas de envolvente generan **recrecimiento espectral (ACLR)** e interferencia entre canales adyacentes.

Para evitar ese paso por el origen se diseñó **OQPSK (Offset QPSK)**, que retrasa el canal `Q(t)` medio período de símbolo (`Ts / 2`) respecto a `I(t)`: así nunca pueden cambiar ambos ejes en el mismo instante, limitando los saltos máximos de fase a `±90°` y eliminando las diagonales por `(0,0)`.

## Experimento 2: Degradación de OSNR / Ruido AWGN y umbral Pre-FEC BER

En un enlace inalámbrico limitado por relación señal a ruido (**SNR**) o en un sistema óptico coherente **DWDM** con múltiples amplificadores **EDFA** en cascada (donde cada etapa suma emisión espontánea amplificada, **ASE**, degradando la **OSNR**):

1. Con el barrido activo, subí gradualmente el control **Ruido de Canal (AWGN / OSNR)** por encima de `0.32`.
2. Observá cómo las 4 nubes verdes de persistencia de fósforo en la constelación se expanden (aumento de la magnitud del vector de error, **EVM**).
3. Cuando los puntos ruidosos cruzan los ejes horizontal (`Q = 0`) o vertical (`I = 0`) —que constituyen los **umbrales de decisión del demodulador coherente**—, un símbolo transmitido en un cuadrante es decodificado como perteneciente a otro cuadrante.

En sistemas ópticos de `100G / 400G` DP-QPSK, esa invasión de los ejes dispara el contador de **Pre-FEC BER** (tasa de error previa a la corrección). Mientras el Pre-FEC BER se mantenga por debajo del límite del código corrector (típicamente `~4×10⁻³` para HD-FEC o `~2×10⁻²` para SD-FEC con LDPC), el bloque FEC reconstruye el flujo libre de errores (*Post-FEC BER* `< 10⁻¹⁵`); superado ese umbral crítico de OSNR, el enlace cae en pérdida de trama.
