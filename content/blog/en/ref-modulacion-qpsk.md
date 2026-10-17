---
title: "QPSK Modulation: Quadrature Phase, Constellation & OSNR Degradation"
date: "2026-10-17"
lang: "en"
summary: "How Gray coding maps I/Q quadrature channels, what I(t) and Q(t) represent, why 180° phase reversals cross through zero amplitude leading to OQPSK, and how AWGN noise triggers Pre-FEC BER."
tags: ["dsp", "qpsk", "rf", "optics", "modulation", "reference"]
category: "referencia"
interactive: "qpsk-simulator"
---

**QPSK (Quadrature Phase Shift Keying)** transmits **2 bits per symbol (dibit)** by encoding data into four phase states separated by **90°**. Instead of doubling the occupied bandwidth over BPSK, QPSK sends two independent bitstreams over the same carrier frequency by exploiting the **trigonometric orthogonality** between a cosine wave and a sine wave.

## What do `I(t)`, `Q(t)`, and `s(t)` mean?

In any quadrature digital modulator or transceiver (SDR, Wi-Fi, DVB-S2, coherent DP-QPSK optical links), the incoming binary stream is split into bit pairs (dibits `b₁b₀`) feeding two parallel branches:

* **`I(t)` — In-Phase Channel (CH1 yellow):** Carries the **even bits (`b₁`)** of the frame as bipolar NRZ levels (`+1 V` for bit `0`, `−1 V` for bit `1`). It is called *In-Phase* because it multiplies the reference cosine carrier **`cos(ωc·t)`** (`0°` phase). On the **X-Y** constellation diagram, `I(t)` drives the **horizontal axis (X)**.
* **`Q(t)` — Quadrature Channel (CH2 cyan):** Carries the **odd bits (`b₀`)** of the frame (`+1 V` for `0`, `−1 V` for `1`). It is called *Quadrature* because it multiplies a sine carrier **`sin(ωc·t)`** shifted by exactly **90° (one quarter cycle)** relative to the cosine wave. Because sine and cosine are **orthogonal** over a symbol period, the receiver can recover `I(t)` and `Q(t)` independently without mutual interference. On the **X-Y** constellation, `Q(t)` drives the **vertical axis (Y)**.
* **`s(t)` — Modulated Carrier (CH3 green):** The actual physical RF or optical waveform transmitted over the channel, formed by summing both orthogonal branches.

## Quadrature Equation and Gray Mapping

During each symbol period `Ts`, the transmitted signal is the energy-normalized orthogonal superposition:

```text
s(t) = (1 / √2) · [ I(t)·cos(ωc·t) − Q(t)·sin(ωc·t) ]
```

To minimize the Bit Error Rate (**BER**) under thermal or amplifier noise, symbols are assigned using **Gray Coding**, ensuring that any two adjacent quadrants differ by **only a single bit**:

| Dibit (`b₁b₀`) | `I(t)` Channel (Even bit, X axis) | `Q(t)` Channel (Odd bit, Y axis) | Carrier Phase of `s(t)` | Quadrant |
|---|---|---|---|---|
| `00` | `+1` | `+1` | **45°** (`π/4`) | I (top-right) |
| `01` | `−1` | `+1` | **135°** (`3π/4`) | II (top-left) |
| `11` | `−1` | `−1` | **225°** (`5π/4`) | III (bottom-left) |
| `10` | `+1` | `−1` | **315°** (`7π/4`) | IV (bottom-right) |

## Interactive Lab: Digital Oscilloscope & QPSK Constellation

Use the interactive instrument below to inspect the digital **`I(t)`** (CH1) and **`Q(t)`** (CH2) waveforms, the modulated carrier **`s(t)`** (CH3), and the **X-Y** constellation diagram in real time. You can click or tap directly on any of the 6 symbol columns on the oscilloscope screen or use the dibit sequence buttons below to cycle its Gray state:

<!-- interactive:qpsk-simulator -->

## Experiment 1: 180° Phase Reversals, Zero-Crossing at `(0,0)`, and OQPSK

1. Click **Forzar 180°** (which alternates `00` ↔ `11`) and then click **PAUSAR / SINGLE SHOT**.
2. On the left display (time domain), inspect the **red markers** along the green **CH3** waveform: right at the symbol boundary, the carrier instantaneously reverses slope relative to the dashed gray `0°` reference wave.
3. On the right display (**X-Y Mode**), notice how the cyan trajectory between `00 (45°)` and `11 (225°)` **passes straight through the origin `(0,0)`**.

When both bits flip simultaneously, the carrier envelope momentarily collapses to **zero amplitude**. Passing a non-constant envelope signal through saturated RF power amplifiers or nonlinear optical fibers produces **spectral regrowth (ACLR)** and inter-channel distortion. **OQPSK (Offset QPSK)** solves this by delaying `Q(t)` by half a symbol period (`Ts / 2`), preventing simultaneous axis flips and limiting phase transitions to `±90°`.

## Experiment 2: OSNR Degradation, AWGN Cloud, and Pre-FEC BER

In long-haul coherent **DWDM** optical links with cascaded **EDFA** amplifiers (accumulating Amplified Spontaneous Emission, **ASE**) or noisy RF channels:

1. With the sweep running, raise the **Ruido de Canal (AWGN / OSNR)** slider above `0.32`.
2. Watch the four green phosphor persistence clouds expand as Error Vector Magnitude (**EVM**) worsens.
3. Once noisy samples cross the horizontal (`Q = 0`) or vertical (`I = 0`) axes —the coherent demodulator's **decision thresholds**—, symbol errors occur and the **Pre-FEC BER** counter spikes.
