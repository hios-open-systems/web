---
title: "QPSK Modulation: I/Q Convention, Constellation and AWGN"
date: "2026-10-17"
lang: "en"
summary: "Consistent bits, colors and phases: ideal transmitted signal, AWGN constellation, theoretical BER and the limits of geometric guides."
tags: ["dsp", "qpsk", "rf", "modulation", "reference"]
category: "referencia"
interactive: "qpsk-simulator"
---

**QPSK (Quadrature Phase Shift Keying)** transmits **2 bits per symbol** through four phases separated by **90°**. At the same symbol rate and with the same pulse shaping, it carries twice as many bits as BPSK. This educational lab models ideal transmission and symbol-domain noise, not a complete receiver or optical link.

## Channels, colors and bit order

Each dibit is written `b₁b₀`, from left to right. In this convention, **I uses the second bit `b₀`, and Q the first bit `b₁`**. We avoid “even/odd”, which depends on frame indexing.

* **CH1: I(t), cyan:** dimensionless levels `+1` for `b₀ = 0` and `−1` for `b₀ = 1`; the horizontal constellation branch.
* **CH2: Q(t), yellow:** levels `+1` for `b₁ = 0` and `−1` for `b₁ = 1`; the vertical branch. In the real waveform it multiplies `−sin(ωc·t)`, consistent with the positive-phase convention.
* **CH3: s(t), green:** the ideal transmitted signal, before noise and without pulse shaping. The dashed gray cosine is the `0°` phase reference.

## Equation and Gray mapping

```text
I = 1 − 2b₀
Q = 1 − 2b₁
s(t) = [I·cos(ωc·t) − Q·sin(ωc·t)] / √2 = cos(ωc·t + φ)
z = (I + jQ) / √2,  |z|² = Es = 1
```

The normalization gives the complex representation `z` unit magnitude and symbol energy. It does not assign volts or unit physical energy to CH3: a real cosine of amplitude 1 has mean power 1/2 in normalized units. Ideal X-Y points are `(±1/√2, ±1/√2)`, whereas CH1 and CH2 show `±1` levels.

| Dibit `b₁b₀` | I (bit `b₀`) | Q (bit `b₁`) | Phase φ |
|---|---|---|---|
| `00` | `+1` | `+1` | 45° |
| `01` | `−1` | `+1` | 135° |
| `11` | `−1` | `−1` | 225° |
| `10` | `+1` | `−1` | 315° |

Adjacent constellation labels differ by one bit: this is Gray mapping. For example, `01` gives negative I, positive Q and phase 135°. A decision in an adjacent quadrant causes one bit error; the noise need not rotate the sample by exactly 90°.

## Interactive lab

Click a time-domain column or use the symbol buttons to cycle through `00 → 01 → 11 → 10`. Speed controls the animation, not a physical baud rate. The carrier control specifies cycles per symbol.

<!-- interactive:qpsk-simulator -->

## Experiment 1: compare phases and interpret the geometric guide

1. Click **Force 180°**: the sequence alternates only `00 ↔ 11`.
2. Click **Pause** or set speed to **0.0x**. Both the animated phase and random samples freeze.
3. Compare 45° and 225° relative to the gray cosine: the **difference between these symbols is 180°**, not a 180° offset from the reference. Red markers indicate any phase change; other patterns can also produce 90° jumps.
4. Toggle **Connect ideal symbols (geometric guide)**. The line between opposite symbols crosses `(0,0)`, but it is not a computed time trajectory.

The model switches I/Q instantaneously. It does not compute a filtered transition or an envelope falling to zero; a zero crossing of the real waveform is not an envelope zero. With pulse shaping, transitions between opposite symbols can produce envelope dips and distortion in a nonlinear stage. The result depends on the filter and amplifier.

**OQPSK** delays one branch by half a symbol (`Ts/2`), avoiding simultaneous I/Q state changes and limiting phase jumps between states to 90°. OQPSK, filters and amplifiers are not implemented in this lab.

## Experiment 2: component noise and theoretical BER

1. Set **AWGN noise: σ per I/Q component** to `0`: samples coincide with ideal symbols; **Es/N₀ = ∞** and **theoretical BER = 0**.
2. Increase σ gradually. Only the constellation spreads: CH3 continues to show the noiseless transmitted signal.
3. At `σ = 0.35`, the model gives approximately **Es/N₀ = 6.11 dB** and **theoretical BER = 0.0217 (2.17%)**. This is not a universal threshold: error probability varies continuously.

```text
rI = I/√2 + nI,  rQ = Q/√2 + nQ
nI, nQ ~ N(0, σ²), independent
N₀ = 2σ²
Es/N₀ [dB] = 10·log10(1/(2σ²))
Pb = Qfunc(1/(√2·σ)) = ½·erfc(1/(2σ))
```

`Qfunc` is the standard normal tail function, distinct from the Q channel. The formula assumes uncoded Gray QPSK, independent Gaussian noise and ideal coherent quadrant decisions. The axes mark those decision boundaries; the simulator does not recover bits from CH3 or count errors. The displayed BER is an analytical prediction, not a measurement of the finite cloud.

Editing symbols or σ while paused recalculates the views using the same frozen standard-normal noise samples. Resizing changes only the drawing scale, not the I/Q values.

## Model scope

Noise is generated directly on normalized symbols, not by demodulating CH3. **Es/N₀ is not optical OSNR**: optical power and a reference bandwidth are not specified. There is no FEC, Pre-FEC/Post-FEC measurement, clock recovery, carrier synchronization or nonlinearity simulation.

For the QPSK convention and BER expression, see [MathWorks technical documentation](https://www.mathworks.com/help/comm/ref/qpskmodulatorbaseband.html).
