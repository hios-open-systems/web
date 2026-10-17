---
title: "QPSK-Modulation: Quadraturphase, Konstellation und OSNR-Degradation"
date: "2026-10-17"
lang: "de"
summary: "Wie die Gray-Codierung I/Q-Quadraturkanäle abbildet, was I(t) und Q(t) bedeuten, warum 180°-Phasensprünge durch den Nullpunkt laufen (OQPSK) und wie AWGN-Rauschen die Pre-FEC-BER erhöht."
tags: ["dsp", "qpsk", "rf", "optik", "modulation", "referencia"]
category: "referencia"
interactive: "qpsk-simulator"
---

Die **QPSK-Modulation (Quadrature Phase Shift Keying)** überträgt **2 Bits pro Symbol (Dibit)** in vier um **90°** getrennten Phasenzuständen. Durch die Orthogonalität zwischen Kosinusträger (**In-Phase `I(t)`**) und Sinusträger (**Quadratur `Q(t)`**) wird die doppelte Bitrate gegenüber BPSK bei gleicher Bandbreite erreicht.

## Was bedeuten `I(t)`, `Q(t)` und `s(t)`?

* **`I(t)` — In-Phase-Kanal (CH1 gelb):** Überträgt die **geraden Bits (`b₁`)** als bipolare Pegel (`+1 V` für `0`, `−1 V` für `1`) und moduliert den Referenz-Kosinusträger `cos(ωc·t)` (`0°`). Im **X-Y**-Konstellationsdiagramm bildet `I(t)` die **horizontale X-Achse**.
* **`Q(t)` — Quadratur-Kanal (CH2 cyan):** Überträgt die **ungeraden Bits (`b₀`)** und moduliert den um **90° (eine Viertelperiode)** verschobenen Sinusträger `sin(ωc·t)`. Durch die Orthogonalität beider Wellen lassen sich `I(t)` und `Q(t)` im Empfänger störungsfrei trennen. Im **X-Y**-Diagramm bildet `Q(t)` die **vertikale Y-Achse**.
* **`s(t)` — Modulierter Träger (CH3 grün):** Das resultierende physikalische Sendesignal aus der Überlagerung beider Kanäle.

## Quadraturgleichung und Gray-Codierung

Das Sendesignal pro Symboldauer `Ts` lautet:

```text
s(t) = (1 / √2) · [ I(t)·cos(ωc·t) − Q(t)·sin(ωc·t) ]
```

Durch **Gray-Codierung** unterscheiden sich benachbarte Quadranten in **nur einem einzigen Bit**:

| Dibit (`b₁b₀`) | Kanal `I(t)` (X-Achse) | Kanal `Q(t)` (Y-Achse) | Trägerphase | Quadrant |
|---|---|---|---|---|
| `00` | `+1` | `+1` | **45°** (`π/4`) | I |
| `01` | `−1` | `+1` | **135°** (`3π/4`) | II |
| `11` | `−1` | `−1` | **225°** (`5π/4`) | III |
| `10` | `+1` | `−1` | **315°** (`7π/4`) | IV |

## Interaktives Labor: Digitaloszilloskop & QPSK-Konstellation

Nutzen Sie das Instrument unten, um die Kanäle **`I(t)`**, **`Q(t)`**, das modulierte Signal **`s(t)`** sowie das **X-Y**-Konstellationsdiagramm in Echtzeit zu untersuchen:

<!-- interactive:qpsk-simulator -->

## Experiment 1: 180°-Phasensprung, Nulldurchgang bei `(0,0)` und OQPSK

1. Klicken Sie auf **Forzar 180°** (`00` ↔ `11`) und anschließend auf **PAUSAR / SINGLE SHOT**.
2. Auf dem linken Bildschirm markieren die **roten Punkte** auf **CH3** die abrupte Phasenumkehr an den Symbolgrenzen.
3. Im **X-Y-Modus** rechts verläuft die Trajektorie zwischen `00 (45°)` und `11 (225°)` **exakt durch den Ursprung `(0,0)`**.

Dieser kurzzeitige Einbruch auf Amplitude Null verursacht in gesättigten HF-Leistungsverstärkern spektrales Nachwachsen (ACLR), weshalb **OQPSK** den `Q`-Kanal um `Ts / 2` verzögert.

## Experiment 2: OSNR-Degradation, AWGN und Pre-FEC-BER

Erhöhen Sie den Regler **Ruido de Canal (AWGN / OSNR)** über `0.32`: sobald die grünen Punktwolken die Entscheidungsachsen (`I = 0, Q = 0`) überschreiten, steigen die **Pre-FEC-BER**-Symbolfehler rapide an.
