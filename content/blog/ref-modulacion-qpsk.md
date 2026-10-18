---
title: "Modulación QPSK: convención I/Q, constelación y ruido AWGN"
date: "2026-10-17"
lang: "es"
summary: "Una convención coherente de bits, colores y fases; señal transmitida ideal, constelación con AWGN, BER teórica y límites de las guías geométricas."
tags: ["dsp", "qpsk", "rf", "modulation", "reference"]
category: "referencia"
interactive: "qpsk-simulator"
---

**QPSK (Quadrature Phase Shift Keying)** transmite **2 bits por símbolo** mediante cuatro fases separadas por **90°**. A igual tasa de símbolos y conformación de pulsos, transporta el doble de bits que BPSK. Este laboratorio es un modelo didáctico de transmisión ideal y ruido en el dominio de los símbolos; no es un receptor completo ni un simulador de enlace óptico.

## Canales, colores y orden de bits

Tomamos cada dibit como `b₁b₀`, escrito de izquierda a derecha. En esta convención, **I depende del segundo bit `b₀` y Q del primero `b₁`**. No usamos “par/impar”, que depende de cómo se numere la trama.

* **CH1: I(t), cian:** niveles adimensionales `+1` para `b₀ = 0` y `−1` para `b₀ = 1`; rama horizontal de la constelación.
* **CH2: Q(t), amarillo:** niveles `+1` para `b₁ = 0` y `−1` para `b₁ = 1`; rama vertical. En la señal real, esta rama multiplica a `−sin(ωc·t)`, coherente con la convención de fase positiva.
* **CH3: s(t), verde:** señal transmitida ideal, antes de agregar ruido, sin filtrado de pulsos. El coseno gris discontinuo es la referencia de fase `0°`.

## Ecuación y mapeo Gray

```text
I = 1 − 2b₀
Q = 1 − 2b₁
s(t) = [I·cos(ωc·t) − Q·sin(ωc·t)] / √2 = cos(ωc·t + φ)
z = (I + jQ) / √2,  |z|² = Es = 1
```

La normalización da magnitud y energía de símbolo unitarias a la representación compleja `z`. No asigna voltios ni energía física unitaria a CH3: el coseno real de amplitud 1 tiene potencia media 1/2 en unidades normalizadas. Los puntos ideales X-Y están en `(±1/√2, ±1/√2)`, mientras que CH1 y CH2 muestran niveles `±1`.

| Dibit `b₁b₀` | I (bit `b₀`) | Q (bit `b₁`) | Fase φ |
|---|---|---|---|
| `00` | `+1` | `+1` | 45° |
| `01` | `−1` | `+1` | 135° |
| `11` | `−1` | `−1` | 225° |
| `10` | `+1` | `−1` | 315° |

Los vecinos de esta constelación difieren en un bit: eso es el mapeo Gray. Por ejemplo, `01` da I negativo, Q positivo y fase 135°. Una decisión en el cuadrante vecino produce un error de bit; no requiere que el ruido rote el punto exactamente 90°.

## Laboratorio interactivo

Tocá una columna del gráfico temporal o usá los botones de símbolos para recorrer `00 → 01 → 11 → 10`. La velocidad controla la animación, no una tasa física en baudios. El control de portadora expresa ciclos por símbolo.

<!-- interactive:qpsk-simulator -->

## Experimento 1: comparar fases y entender la guía geométrica

1. Presioná **Forzar 180°**: la secuencia alterna exclusivamente `00 ↔ 11`.
2. Presioná **Pausar** o llevá la velocidad a **0.0x**. Se congelan tanto la fase animada como las muestras aleatorias.
3. Compará 45° y 225° respecto del coseno gris: hay **180° entre esos símbolos**, no 180° respecto de la referencia. Los marcadores rojos indican cualquier cambio de fase; otros patrones también pueden producir saltos de 90°.
4. Activá o desactivá **Unir símbolos ideales (guía geométrica)**. La recta entre símbolos opuestos cruza `(0,0)`, pero no es una trayectoria temporal calculada.

El modelo usa cambios instantáneos de I/Q. No calcula muestras de una transición filtrada ni una envolvente que caiga a cero; que la onda real cruce cero tampoco significa que su envolvente sea cero. En un transmisor con conformación de pulsos, las transiciones entre símbolos opuestos pueden producir caídas de envolvente y distorsión al atravesar una etapa no lineal. El resultado depende del filtro y del amplificador.

**OQPSK** retrasa una rama medio símbolo (`Ts/2`), evitando cambios simultáneos de I y Q y limitando los saltos entre estados a 90°. OQPSK, los filtros y los amplificadores no están implementados en este laboratorio.

## Experimento 2: ruido por componente y BER teórica

1. Fijá **Ruido AWGN: σ por componente I/Q** en `0`: los puntos coinciden con los símbolos ideales; **Es/N₀ = ∞** y **BER teórica = 0**.
2. Subí σ progresivamente. Solo se ensancha la constelación: CH3 sigue mostrando la señal transmitida, sin ruido.
3. En `σ = 0.35`, el modelo da aproximadamente **Es/N₀ = 6.11 dB** y **BER teórica = 0.0217 (2.17 %)**. No es un umbral universal: la probabilidad de error varía de forma continua.

```text
rI = I/√2 + nI,  rQ = Q/√2 + nQ
nI, nQ ~ N(0, σ²), independientes
N₀ = 2σ²
Es/N₀ [dB] = 10·log10(1/(2σ²))
Pb = Qfunc(1/(√2·σ)) = ½·erfc(1/(2σ))
```

`Qfunc` es la cola de una normal estándar, distinta del canal Q. La fórmula supone QPSK Gray sin codificación, ruido gaussiano independiente y decisiones coherentes ideales por cuadrante. Los ejes delimitan esas regiones de decisión; el simulador no recupera bits de CH3 ni cuenta errores. La BER mostrada es una predicción analítica, no una medición de la nube finita.

Al editar símbolos o σ mientras está pausado, las vistas se recalculan con las mismas muestras de ruido estándar congeladas. Cambiar el tamaño de la pantalla solo cambia la escala de dibujo, no los valores I/Q.

## Alcance del modelo

El ruido se genera directamente sobre símbolos normalizados, no demodulando CH3. **Es/N₀ no es OSNR óptica**: no se especifican potencia óptica ni ancho de banda de referencia. No hay FEC, medición Pre-FEC/Post-FEC, recuperación de reloj, sincronización de portadora ni simulación de no linealidades.

Para contrastar la convención de QPSK y la expresión de BER: [documentación técnica de MathWorks](https://www.mathworks.com/help/comm/ref/qpskmodulatorbaseband.html).
