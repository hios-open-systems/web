---
title: "QPSK-Modulation: Quadraturphase, Konstellation und OSNR-Degradation"
date: "2026-10-17"
lang: "de"
summary: "Wie die Gray-Codierung I/Q-Quadraturkanäle abbildet, warum 180°-Phasensprünge durch den Nullpunkt laufen (OQPSK) und wie AWGN-Rauschen die Pre-FEC-BER erhöht."
tags: ["dsp", "qpsk", "rf", "optik", "modulation", "referencia"]
category: "referencia"
interactive: "qpsk-simulator"
---

Die **QPSK-Modulation (Quadrature Phase Shift Keying)** überträgt **2 Bits pro Symbol (Dibit)** in vier um $90^\circ$ getrennten Phasenzuständen. Durch die Orthogonalität zwischen Kosinusträger (**In-Phase $I(t)$**) und Sinusträger (**Quadratur $Q(t)$**) wird die doppelte Bitrate gegenüber BPSK bei gleicher Bandbreite erreicht.

## Quadraturgleichung und Gray-Codierung

Das Sendesignal pro Symboldauer $T_s$ lautet:

$$s(t) = \frac{1}{\sqrt{2}} \left[ I(t)\cos(\omega_c t) - Q(t)\sin(\omega_c t) \right]$$

Durch **Gray-Codierung** unterscheiden sich benachbarte Quadranten in **nur einem einzigen Bit**:

| Dibit ($b_1 b_0$) | Kanal $I$ | Kanal $Q$ | Trägerphase | Quadrant |
|---|---|---|---|---|
| `00` | $+1$ | $+1$ | $45^\circ$ ($\pi/4$) | I |
| `01` | $-1$ | $+1$ | $135^\circ$ ($3\pi/4$) | II |
| `11` | $-1$ | $-1$ | $225^\circ$ ($5\pi/4$) | III |
| `10` | $+1$ | $-1$ | $315^\circ$ ($7\pi/4$) | IV |

## Interaktives Labor: Digitaloszilloskop & QPSK-Konstellation

Nutzen Sie das Instrument unten, um die Kanäle $I(t)$, $Q(t)$, das modulierte Signal $s(t)$ sowie das $X\text{-}Y$-Konstellationsdiagramm in Echtzeit zu untersuchen:

<!-- interactive:qpsk-simulator -->

## Experiment 1: 180°-Phasensprung, Nulldurchgang bei $(0,0)$ und OQPSK

1. Klicken Sie auf **Forzar 180°** (`00` $\leftrightarrow$ `11`) und anschließend auf **PAUSAR / SINGLE SHOT**.
2. Auf dem linken Bildschirm markieren die **roten Punkte** auf **CH3** die abrupte Phasenumkehr an den Symbolgrenzen.
3. Im **X-Y-Modus** rechts verläuft die Trajektorie zwischen `00 (45°)` und `11 (225°)` **exakt durch den Ursprung $(0,0)$**.

Dieser kurzzeitige Einbruch auf Amplitude Null verursacht in gesättigten HF-Leistungsverstärkern spektrales Nachwachsen (ACLR), weshalb **OQPSK** den $Q$-Kanal um $T_s/2$ verzögert.

## Experiment 2: OSNR-Degradation, AWGN und Pre-FEC-BER

Erhöhen Sie den Regler **Ruido de Canal (AWGN / OSNR)** über `0.32`: sobald die grünen Punktwolken die Entscheidungsachsen ($I=0, Q=0$) überschreiten, steigen die **Pre-FEC-BER**-Symbolfehler rapide an.
