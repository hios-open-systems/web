---
title: "QPSK Modulation: Quadrature Phase, Constellation & OSNR Degradation"
date: "2026-10-17"
lang: "en"
summary: "How Gray coding maps I/Q quadrature channels, why 180° phase reversals cross through zero amplitude leading to OQPSK, and how AWGN noise triggers Pre-FEC BER."
tags: ["dsp", "qpsk", "rf", "optics", "modulation", "reference"]
category: "referencia"
interactive: "qpsk-simulator"
---

**QPSK (Quadrature Phase Shift Keying)** transmits **2 bits per symbol (dibit)** by encoding data into four phase states separated by $90^\circ$. Instead of doubling the occupied bandwidth over BPSK, QPSK exploits the orthogonality between a cosine carrier —the **In-Phase channel $I(t)$**— and a sine carrier —the **Quadrature channel $Q(t)$**— sharing the exact same carrier frequency.

## Quadrature Equation and Gray Mapping

During each symbol period $T_s$, the transmitted signal is the energy-normalized orthogonal superposition:

$$s(t) = \frac{1}{\sqrt{2}} \left[ I(t)\cos(\omega_c t) - Q(t)\sin(\omega_c t) \right]$$

To minimize the Bit Error Rate (**BER**) under thermal or amplifier noise, symbols are assigned using **Gray Coding**, ensuring that any two adjacent quadrants differ by **only a single bit**:

| Dibit ($b_1 b_0$) | $I$ Channel (Even) | $Q$ Channel (Odd) | Carrier Phase | Quadrant |
|---|---|---|---|---|
| `00` | $+1$ | $+1$ | $45^\circ$ ($\pi/4$) | I |
| `01` | $-1$ | $+1$ | $135^\circ$ ($3\pi/4$) | II |
| `11` | $-1$ | $-1$ | $225^\circ$ ($5\pi/4$) | III |
| `10` | $+1$ | $-1$ | $315^\circ$ ($7\pi/4$) | IV |

## Interactive Lab: Digital Oscilloscope & QPSK Constellation

Use the interactive instrument below to inspect the digital $I(t)$ and $Q(t)$ waveforms, the modulated carrier $s(t)$, and the $X\text{-}Y$ constellation diagram in real time. You can click or tap directly on any of the 6 symbol columns on the oscilloscope screen or use the dibit sequence buttons below to cycle its Gray state:

<!-- interactive:qpsk-simulator -->

## Experiment 1: 180° Phase Reversals, Zero-Crossing at $(0,0)$, and OQPSK

1. Click **Forzar 180°** (which alternates `00` $\leftrightarrow$ `11`) and then click **PAUSAR / SINGLE SHOT**.
2. On the left display (time domain), inspect the **red markers** along the green **CH3** waveform: right at the symbol boundary, the carrier instantaneously reverses slope relative to the dashed gray $0^\circ$ reference wave.
3. On the right display (**X-Y Mode**), notice how the cyan trajectory between `00 (45°)` and `11 (225°)` **passes straight through the origin $(0,0)$**.

When both bits flip simultaneously, the carrier envelope momentarily collapses to **zero amplitude**. Passing a non-constant envelope signal through saturated RF power amplifiers or nonlinear optical fibers produces **spectral regrowth (ACLR)** and inter-channel distortion. **OQPSK (Offset QPSK)** solves this by delaying $Q(t)$ by half a symbol period ($T_s/2$), preventing simultaneous axis flips and limiting phase transitions to $\pm 90^\circ$.

## Experiment 2: OSNR Degradation, AWGN Cloud, and Pre-FEC BER

In long-haul coherent **DWDM** optical links with cascaded **EDFA** amplifiers (accumulating Amplified Spontaneous Emission, **ASE**) or noisy RF channels:

1. With the sweep running, raise the **Ruido de Canal (AWGN / OSNR)** slider above `0.32`.
2. Watch the four green phosphor persistence clouds expand as Error Vector Magnitude (**EVM**) worsens.
3. Once noisy samples cross the horizontal ($Q=0$) or vertical ($I=0$) axes —the coherent demodulator's **decision thresholds**—, symbol errors occur and the **Pre-FEC BER** counter spikes.
