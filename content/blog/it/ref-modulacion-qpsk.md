---
title: "Modulazione QPSK: fase in quadratura, costellazione e degradazione OSNR"
date: "2026-10-17"
lang: "it"
summary: "Come la codifica Gray mappa i canali I/Q, cosa significano I(t) e Q(t), perché i salti di fase di 180° passano per ampiezza zero (OQPSK) e come il rumore AWGN innesca il Pre-FEC BER."
tags: ["dsp", "qpsk", "rf", "ottica", "modulazione", "referencia"]
category: "referencia"
interactive: "qpsk-simulator"
---

La modulazione **QPSK (Quadrature Phase Shift Keying)** trasmette **2 bit per simbolo (dibit)** codificando l'informazione in quattro stati di fase separati da **90°**, sfruttando l'ortogonalità tra la portante coseno (**In-Fase `I(t)`**) e la portante seno (**In-Quadratura `Q(t)`**).

## Cosa significano i canali `I(t)`, `Q(t)` e `s(t)`?

* **`I(t)` — Canale In-Fase (CH1 giallo):** Trasporta i **bit pari (`b₁`)** come livelli bipolari (`+1 V` per `0`, `−1 V` per `1`) e modula la portante coseno `cos(ωc·t)` (fase `0°`). Nel diagramma di costellazione **X-Y**, `I(t)` controlla l'**asse orizzontale (X)**.
* **`Q(t)` — Canale In-Quadratura (CH2 ciano):** Trasporta i **bit dispari (`b₀`)** e modula la portante seno `sin(ωc·t)`, sfasata di esattamente **90° (un quarto di ciclo)** rispetto al coseno. Poiché seno e coseno sono ortogonali, il ricevitore separa `I(t)` e `Q(t)` senza interferenza. Nella costellazione **X-Y**, `Q(t)` controlla l'**asse verticale (Y)**.
* **`s(t)` — Portante Modulata (CH3 verde):** Il segnale fisico reale trasmesso sul canale, ottenuto sommando le due componenti ortogonali.

## Equazione in quadratura e codifica Gray

Il segnale trasmesso durante ogni periodo di simbolo `Ts` è:

```text
s(t) = (1 / √2) · [ I(t)·cos(ωc·t) − Q(t)·sin(ωc·t) ]
```

La **Codifica Gray** assicura che quadranti adiacenti differiscano per **un solo bit**:

| Dibit (`b₁b₀`) | Canale `I(t)` (Bit pari, asse X) | Canale `Q(t)` (Bit dispari, asse Y) | Fase risultante | Quadrante |
|---|---|---|---|---|
| `00` | `+1` | `+1` | **45°** (`π/4`) | I |
| `01` | `−1` | `+1` | **135°** (`3π/4`) | II |
| `11` | `−1` | `−1` | **225°** (`5π/4`) | III |
| `10` | `+1` | `−1` | **315°** (`7π/4`) | IV |

## Laboratorio interattivo: Oscilloscopio e Costellazione QPSK

Usa lo strumento digitale qui sotto per ispezionare in tempo reale i canali **`I(t)`** e **`Q(t)`**, la portante modulata **`s(t)`** e il diagramma di costellazione in modalità **X-Y**:

<!-- interactive:qpsk-simulator -->

## Esperimento 1: Il salto di 180°, il passaggio per `(0,0)` e OQPSK

1. Premi **Forzar 180°** (`00` ↔ `11`) e poi **PAUSAR / SINGLE SHOT**.
2. Sullo schermo sinistro, osserva i **marcatori rossi** sull'onda verde (**CH3**): alla frontiera del simbolo la portante inverte istantaneamente la fase.
3. Sullo schermo destro (**Modalità X-Y**), la transizione tra `00 (45°)` e `11 (225°)` **attraversa esattamente l'origine `(0,0)`**, portando l'inviluppo ad ampiezza zero (motivo per cui è nata la modulazione **OQPSK**).

## Esperimento 2: Degradazione OSNR, rumore AWGN e soglia Pre-FEC BER

Alzando lo slider **Ruido de Canal (AWGN / OSNR)** oltre `0.32`, le quattro nuvole verdi di persistenza si allargano e attraversano gli assi di decisione (`I = 0, Q = 0`), facendo salire il contatore **Pre-FEC BER**.
