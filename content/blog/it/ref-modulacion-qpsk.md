---
title: "Modulazione QPSK: fase in quadratura, costellazione e degradazione OSNR"
date: "2026-10-17"
lang: "it"
summary: "Come la codifica Gray mappa i canali I/Q, perché i salti di fase di 180° passano per ampiezza zero (OQPSK) e come il rumore AWGN innesca il Pre-FEC BER."
tags: ["dsp", "qpsk", "rf", "ottica", "modulazione", "referencia"]
category: "referencia"
interactive: "qpsk-simulator"
---

La modulazione **QPSK (Quadrature Phase Shift Keying)** trasmette **2 bit per simbolo (dibit)** codificando l'informazione in quattro stati di fase separati da $90^\circ$, sfruttando l'ortogonalità tra la portante coseno (**In-Fase $I(t)$**) e la portante seno (**In-Quadratura $Q(t)$**).

## Equazione in quadratura e codifica Gray

Il segnale trasmesso durante ogni periodo di simbolo $T_s$ è:

$$s(t) = \frac{1}{\sqrt{2}} \left[ I(t)\cos(\omega_c t) - Q(t)\sin(\omega_c t) \right]$$

La **Codifica Gray** assicura che quadranti adiacenti differiscano per **un solo bit**:

| Dibit ($b_1 b_0$) | Canale $I$ (Pari) | Canale $Q$ (Dispari) | Fase risultante | Quadrante |
|---|---|---|---|---|
| `00` | $+1$ | $+1$ | $45^\circ$ ($\pi/4$) | I |
| `01` | $-1$ | $+1$ | $135^\circ$ ($3\pi/4$) | II |
| `11` | $-1$ | $-1$ | $225^\circ$ ($5\pi/4$) | III |
| `10` | $+1$ | $-1$ | $315^\circ$ ($7\pi/4$) | IV |

## Laboratorio interattivo: Oscilloscopio e Costellazione QPSK

Usa lo strumento digitale qui sotto per ispezionare in tempo reale i canali $I(t)$ e $Q(t)$, la portante modulata $s(t)$ e il diagramma di costellazione in modalità $X\text{-}Y$:

<!-- interactive:qpsk-simulator -->

## Esperimento 1: Il salto di 180°, il passaggio per $(0,0)$ e OQPSK

1. Premi **Forzar 180°** (`00` $\leftrightarrow$ `11`) e poi **PAUSAR / SINGLE SHOT**.
2. Sullo schermo sinistro, osserva i **marcatori rossi** sull'onda verde (**CH3**): alla frontiera del simbolo la portante inverte istantaneamente la fase.
3. Sullo schermo destro (**Modalità X-Y**), la transizione tra `00 (45°)` e `11 (225°)` **attraversa esattamente l'origine $(0,0)$**, portando l'inviluppo ad ampiezza zero (motivo per cui è nata la modulazione **OQPSK**).

## Esperimento 2: Degradazione OSNR, rumore AWGN e soglia Pre-FEC BER

Alzando lo slider **Ruido de Canal (AWGN / OSNR)** oltre `0.32`, le quattro nuvole verdi di persistenza si allargano e attraversano gli assi di decisione ($I=0, Q=0$), facendo salire il contatore **Pre-FEC BER**.
