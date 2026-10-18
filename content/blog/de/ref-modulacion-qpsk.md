---
title: "QPSK-Modulation: I/Q-Konvention, Konstellation und AWGN"
date: "2026-10-17"
lang: "de"
summary: "Konsistente Bits, Farben und Phasen: ideales Sendesignal, AWGN-Konstellation, theoretische BER und Grenzen geometrischer Hilfslinien."
tags: ["dsp", "qpsk", "rf", "modulation", "reference"]
category: "referencia"
interactive: "qpsk-simulator"
---

**QPSK (Quadrature Phase Shift Keying)** überträgt **2 Bits pro Symbol** mit vier um **90°** versetzten Phasen. Bei gleicher Symbolrate und Pulsformung werden doppelt so viele Bits wie bei BPSK übertragen. Dieses Lehrmodell zeigt die ideale Übertragung und Rauschen im Symbolraum, keinen vollständigen Empfänger oder optischen Übertragungskanal.

## Kanäle, Farben und Bitreihenfolge

Ein Dibit wird von links nach rechts als `b₁b₀` geschrieben. In dieser Konvention hängt **I vom zweiten Bit `b₀` und Q vom ersten Bit `b₁`** ab. Die Bezeichnungen „gerade/ungerade“ werden vermieden, da sie von der Nummerierung des Datenstroms abhängen.

* **CH1: I(t), Cyan:** dimensionslose Pegel `+1` für `b₀ = 0` und `−1` für `b₀ = 1`; horizontale Komponente der Konstellation.
* **CH2: Q(t), Gelb:** Pegel `+1` für `b₁ = 0` und `−1` für `b₁ = 1`; vertikale Komponente. Im reellen Signal multipliziert sie `−sin(ωc·t)`, passend zur positiven Phasenkonvention.
* **CH3: s(t), Grün:** ideales Sendesignal vor dem Rauschen und ohne Pulsformung. Der gestrichelte graue Kosinus ist die Phasenreferenz `0°`.

## Gleichung und Gray-Zuordnung

```text
I = 1 − 2b₀
Q = 1 − 2b₁
s(t) = [I·cos(ωc·t) − Q·sin(ωc·t)] / √2 = cos(ωc·t + φ)
z = (I + jQ) / √2,  |z|² = Es = 1
```

Die Normierung gibt der komplexen Darstellung `z` den Betrag und die Symbolenergie 1. CH3 erhält dadurch weder eine Volt-Skalierung noch eine physikalische Einheitsenergie: Ein reeller Kosinus mit Amplitude 1 hat die normierte mittlere Leistung 1/2. Ideale X-Y-Punkte liegen bei `(±1/√2, ±1/√2)`, während CH1 und CH2 die Pegel `±1` zeigen.

| Dibit `b₁b₀` | I (Bit `b₀`) | Q (Bit `b₁`) | Phase φ |
|---|---|---|---|
| `00` | `+1` | `+1` | 45° |
| `01` | `−1` | `+1` | 135° |
| `11` | `−1` | `−1` | 225° |
| `10` | `+1` | `−1` | 315° |

Benachbarte Konstellationspunkte unterscheiden sich in einem Bit: Das ist die Gray-Zuordnung. Beispielsweise ergibt `01` ein negatives I, ein positives Q und 135°. Eine Entscheidung im benachbarten Quadranten verursacht einen Bitfehler; das Rauschen muss den Punkt dazu nicht exakt um 90° drehen.

## Interaktives Labor

Eine Spalte im Zeitdiagramm anklicken oder die Symboltasten verwenden, um `00 → 01 → 11 → 10` zu durchlaufen. Die Geschwindigkeit steuert die Animation, keine physikalische Baudrate. Der Trägerregler gibt Perioden pro Symbol an.

<!-- interactive:qpsk-simulator -->

## Experiment 1: Phasen vergleichen und Hilfslinien verstehen

1. **180° erzwingen** anklicken: Die Folge wechselt ausschließlich zwischen `00 ↔ 11`.
2. **Pausieren** anklicken oder die Geschwindigkeit auf **0.0x** setzen. Animierte Phase und Zufallswerte werden eingefroren.
3. 45° und 225° relativ zum grauen Kosinus vergleichen: **Zwischen den Symbolen liegen 180°**, nicht zwischen Signal und Referenz. Rote Markierungen kennzeichnen jeden Phasenwechsel; andere Muster können auch 90°-Sprünge enthalten.
4. **Ideale Symbole verbinden (geometrische Hilfe)** ein- und ausschalten. Die Gerade zwischen gegenüberliegenden Symbolen verläuft durch `(0,0)`, stellt aber keinen berechneten zeitlichen Verlauf dar.

Das Modell schaltet I/Q unmittelbar um. Es berechnet weder einen gefilterten Übergang noch ein Absinken der Hüllkurve auf null. Ein Nulldurchgang des reellen Signals ist ebenfalls kein Nulldurchgang der Hüllkurve. Mit Pulsformung können Übergänge zwischen gegenüberliegenden Symbolen Hüllkurveneinbrüche und Verzerrungen in einer nichtlinearen Stufe verursachen. Das Ergebnis hängt von Filter und Verstärker ab.

**OQPSK** verzögert einen Zweig um ein halbes Symbol (`Ts/2`), verhindert gleichzeitige I/Q-Zustandswechsel und begrenzt Phasensprünge zwischen Zuständen auf 90°. OQPSK, Filter und Verstärker sind in diesem Labor nicht implementiert.

## Experiment 2: Komponentenrauschen und theoretische BER

1. **AWGN-Rauschen: σ pro I/Q-Komponente** auf `0` setzen: Die Punkte liegen auf den idealen Symbolen; **Es/N₀ = ∞** und **theoretische BER = 0**.
2. σ langsam erhöhen. Nur die Konstellation streut stärker; CH3 zeigt weiterhin das rauschfreie Sendesignal.
3. Bei `σ = 0.35` ergibt das Modell etwa **Es/N₀ = 6.11 dB** und **theoretische BER = 0.0217 (2,17 %)**. Das ist keine universelle Schwelle: Die Fehlerwahrscheinlichkeit ändert sich kontinuierlich.

```text
rI = I/√2 + nI,  rQ = Q/√2 + nQ
nI, nQ ~ N(0, σ²), unabhängig
N₀ = 2σ²
Es/N₀ [dB] = 10·log10(1/(2σ²))
Pb = Qfunc(1/(√2·σ)) = ½·erfc(1/(2σ))
```

`Qfunc` ist die obere Verteilungsfunktion der Standardnormalverteilung, nicht der Q-Kanal. Die Formel setzt uncodierte Gray-QPSK, unabhängiges Gaußrauschen und ideale kohärente Quadrantenentscheidungen voraus. Die Achsen markieren diese Entscheidungsgrenzen; der Simulator gewinnt keine Bits aus CH3 zurück und zählt keine Fehler. Die angezeigte BER ist eine analytische Vorhersage, keine Messung der endlichen Punktwolke.

Beim Bearbeiten von Symbolen oder σ im pausierten Zustand werden die Ansichten mit denselben eingefrorenen standardnormalverteilten Rauschwerten neu berechnet. Eine Größenänderung verändert nur die Darstellung, nicht die I/Q-Werte.

## Modellgrenzen

Das Rauschen wird direkt auf normierte Symbole angewendet; CH3 wird nicht demoduliert. **Es/N₀ ist keine optische OSNR**: Optische Leistung und Referenzbandbreite sind nicht definiert. FEC, Pre-FEC/Post-FEC-Messung, Taktrückgewinnung, Trägersynchronisation und Nichtlinearitäten werden nicht simuliert.

Zur QPSK-Konvention und BER-Formel: [technische Dokumentation von MathWorks](https://www.mathworks.com/help/comm/ref/qpskmodulatorbaseband.html).
