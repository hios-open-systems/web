---
title: "Modulación QPSK: fase en cuadratura, constelación y degradación OSNR"
date: "2026-10-17"
lang: "es"
summary: "Cómo funciona el mapeo Gray en cuadratura I/Q, por qué los saltos de 180° cruzan por amplitud cero dando origen a OQPSK, y cómo el ruido AWGN dispara el Pre-FEC BER."
tags: ["dsp", "qpsk", "rf", "optica", "modulacion", "referencia"]
category: "referencia"
interactive: "qpsk-simulator"
---

La modulación **QPSK (Quadrature Phase Shift Keying)** transmite **2 bits por símbolo (dibit)** codificando la información en cuatro estados de fase separados por $90^\circ$. En lugar de duplicar el ancho de banda para duplicar la tasa binaria respecto a BPSK, QPSK aprovecha la ortogonalidad entre una portadora coseno —canal **En-Fase $I(t)$**— y una portadora seno —canal **En-Cuadratura $Q(t)$**— compartiendo la misma frecuencia portadora.

## Ecuación en cuadratura y mapeo Gray

La señal transmitida durante cada período de símbolo $T_s$ se expresa como la superposición ortogonal normalizada en energía:

$$s(t) = \frac{1}{\sqrt{2}} \left[ I(t)\cos(\omega_c t) - Q(t)\sin(\omega_c t) \right]$$

Para minimizar la tasa de error de bit (**BER**) frente al ruido térmico o de amplificación, los símbolos no se asignan en orden binario natural sino mediante **Codificación Gray**, donde dos cuadrantes adyacentes difieren en **un único bit**:

| Dibit ($b_1 b_0$) | Canal $I$ (Par) | Canal $Q$ (Impar) | Fase resultante | Cuadrante |
|---|---|---|---|---|
| `00` | $+1$ | $+1$ | $45^\circ$ ($\pi/4$) | I |
| `01` | $-1$ | $+1$ | $135^\circ$ ($3\pi/4$) | II |
| `11` | $-1$ | $-1$ | $225^\circ$ ($5\pi/4$) | III |
| `10` | $+1$ | $-1$ | $315^\circ$ ($7\pi/4$) | IV |

Si el ruido del canal desvía un símbolo hacia el cuadrante vecino (error de fase de $\pm 90^\circ$), el receptor solo comete **1 error de bit** de los 2 transmitidos.

## Laboratorio interactivo: Osciloscopio y Constelación QPSK

Usá el instrumento digital de abajo para inspeccionar en tiempo real los canales digitales $I(t)$ y $Q(t)$, la portadora modulada $s(t)$ y el diagrama de constelación en modo $X\text{-}Y$. Podés hacer clic o tocar directamente sobre cualquiera de las 6 columnas en la pantalla del osciloscopio o en los botones de secuencia para rotar su estado:

<!-- interactive:qpsk-simulator -->

## Experimento 1: El salto de 180°, el cruce por $(0,0)$ y por qué nació OQPSK

1. En el panel de control, presioná el botón **Forzar 180°** (que alterna `00` $\leftrightarrow$ `11`) y luego presioná **PAUSAR / SINGLE SHOT**.
2. En la pantalla izquierda (dominio del tiempo), observá los **marcadores rojos** sobre la onda verde (**CH3**): justo en la frontera del símbolo, cuando la portadora venía subiendo, invierte su pendiente de forma instantánea respecto a la portadora gris de referencia ($0^\circ$).
3. En la pantalla derecha (**Modo X-Y**), observá la línea celeste de transición vectorial entre `00 (45°)` y `11 (225°)`: **cruza exactamente por el origen $(0,0)$**.

Cuando ambos bits cambian al mismo tiempo ($I$ y $Q$ invierten su signo simultáneamente), la envolvente de la portadora colapsa momentáneamente a **amplitud cero** (modulación de amplitud del 100% durante la transición filtrada). En transmisores de radiofrecuencia con amplificadores de potencia operando cerca de la saturación (Clase AB/C) o en enlaces ópticos coherentes con no-linealidades de Kerr, esas fluctuaciones abruptas de envolvente generan **recrecimiento espectral (ACLR)** e interferencia entre canales adyacentes.

Para evitar ese paso por el origen se diseñó **OQPSK (Offset QPSK)**, que retrasa el canal $Q(t)$ medio período de símbolo ($T_s / 2$) respecto a $I(t)$: así nunca pueden cambiar ambos ejes en el mismo instante, limitando los saltos máximos de fase a $\pm 90^\circ$ y eliminando las diagonales por $(0,0)$.

## Experimento 2: Degradación de OSNR / Ruido AWGN y umbral Pre-FEC BER

En un enlace inalámbrico limitado por relación señal a ruido (**SNR**) o en un sistema óptico coherente **DWDM** con múltiples amplificadores **EDFA** en cascada (donde cada etapa suma emisión espontánea amplificada, **ASE**, degradando la **OSNR**):

1. Con el barrido activo, subí gradualmente el control **Ruido de Canal (AWGN / OSNR)** por encima de `0.32`.
2. Observá cómo las 4 nubes verdes de persistencia de fósforo en la constelación se expanden (aumento de la magnitud del vector de error, **EVM**).
3. Cuando los puntos ruidosos cruzan los ejes horizontal ($Q=0$) o vertical ($I=0$) —que constituyen los **umbrales de decisión del demodulador coherente**—, un símbolo transmitido en un cuadrante es decodificado como perteneciente a otro cuadrante.

En sistemas ópticos de $100\text{G}/400\text{G}$ DP-QPSK, esa invasión de los ejes dispara el contador de **Pre-FEC BER** (tasa de error previa a la corrección). Mientras el Pre-FEC BER se mantenga por debajo del límite del código corrector (típicamente $\sim 4\times 10^{-3}$ para HD-FEC o $\sim 2\times 10^{-2}$ para SD-FEC con LDPC), el bloque FEC reconstruye el flujo libre de errores (*Post-FEC BER* $< 10^{-15}$); superado ese umbral crítico de OSNR, el enlace cae en pérdida de trama.
