---
title: "Modulazione QPSK: convenzione I/Q, costellazione e AWGN"
date: "2026-10-17"
lang: "it"
summary: "Bit, colori e fasi coerenti: segnale trasmesso ideale, costellazione AWGN, BER teorico e limiti delle guide geometriche."
tags: ["dsp", "qpsk", "rf", "modulation", "reference"]
category: "referencia"
interactive: "qpsk-simulator"
---

**QPSK (Quadrature Phase Shift Keying)** trasmette **2 bit per simbolo** con quattro fasi separate da **90°**. A parità di frequenza dei simboli e di sagomatura degli impulsi, trasporta il doppio dei bit rispetto a BPSK. Questo laboratorio didattico modella la trasmissione ideale e il rumore nel dominio dei simboli, non un ricevitore completo o un collegamento ottico.

## Canali, colori e ordine dei bit

Ogni dibit è scritto `b₁b₀`, da sinistra a destra. In questa convenzione, **I dipende dal secondo bit `b₀` e Q dal primo bit `b₁`**. Evitiamo “pari/dispari”, che dipende dalla numerazione della trama.

* **CH1: I(t), ciano:** livelli adimensionali `+1` per `b₀ = 0` e `−1` per `b₀ = 1`; componente orizzontale della costellazione.
* **CH2: Q(t), giallo:** livelli `+1` per `b₁ = 0` e `−1` per `b₁ = 1`; componente verticale. Nel segnale reale moltiplica `−sin(ωc·t)`, coerentemente con la convenzione di fase positiva.
* **CH3: s(t), verde:** segnale trasmesso ideale, prima del rumore e senza sagomatura degli impulsi. Il coseno grigio tratteggiato è il riferimento di fase `0°`.

## Equazione e mappatura Gray

```text
I = 1 − 2b₀
Q = 1 − 2b₁
s(t) = [I·cos(ωc·t) − Q·sin(ωc·t)] / √2 = cos(ωc·t + φ)
z = (I + jQ) / √2,  |z|² = Es = 1
```

La normalizzazione assegna alla rappresentazione complessa `z` modulo ed energia di simbolo unitari. Non assegna volt né energia fisica unitaria a CH3: un coseno reale di ampiezza 1 ha potenza media 1/2 in unità normalizzate. I punti ideali X-Y sono `(±1/√2, ±1/√2)`, mentre CH1 e CH2 mostrano livelli `±1`.

| Dibit `b₁b₀` | I (bit `b₀`) | Q (bit `b₁`) | Fase φ |
|---|---|---|---|
| `00` | `+1` | `+1` | 45° |
| `01` | `−1` | `+1` | 135° |
| `11` | `−1` | `−1` | 225° |
| `10` | `+1` | `−1` | 315° |

Le etichette dei punti adiacenti differiscono per un bit: questa è la mappatura Gray. Per esempio, `01` produce I negativo, Q positivo e fase 135°. Una decisione nel quadrante adiacente causa un errore di bit; non è necessario che il rumore ruoti il punto esattamente di 90°.

## Laboratorio interattivo

Tocca una colonna del grafico temporale oppure usa i pulsanti dei simboli per scorrere `00 → 01 → 11 → 10`. La velocità controlla l'animazione, non una frequenza fisica in baud. Il controllo della portante indica i cicli per simbolo.

<!-- interactive:qpsk-simulator -->

## Esperimento 1: confrontare le fasi e interpretare la guida geometrica

1. Premi **Forza 180°**: la sequenza alterna esclusivamente `00 ↔ 11`.
2. Premi **Pausa** oppure imposta la velocità a **0.0x**. Si bloccano sia la fase animata sia i campioni casuali.
3. Confronta 45° e 225° rispetto al coseno grigio: ci sono **180° tra i simboli**, non rispetto al riferimento. I marcatori rossi indicano ogni cambio di fase; altre sequenze possono includere salti di 90°.
4. Attiva e disattiva **Collega i simboli ideali (guida geometrica)**. La retta tra simboli opposti attraversa `(0,0)`, ma non è una traiettoria temporale calcolata.

Il modello cambia I/Q istantaneamente. Non calcola una transizione filtrata né un inviluppo che scende a zero; anche l'attraversamento dello zero del segnale reale non equivale a un inviluppo nullo. Con la sagomatura degli impulsi, le transizioni tra simboli opposti possono causare cali dell'inviluppo e distorsione in uno stadio non lineare. Il risultato dipende dal filtro e dall'amplificatore.

**OQPSK** ritarda un ramo di mezzo simbolo (`Ts/2`), evitando cambi simultanei di I e Q e limitando i salti di fase tra stati a 90°. OQPSK, filtri e amplificatori non sono implementati in questo laboratorio.

## Esperimento 2: rumore per componente e BER teorico

1. Imposta **Rumore AWGN: σ per componente I/Q** a `0`: i punti coincidono con i simboli ideali; **Es/N₀ = ∞** e **BER teorico = 0**.
2. Aumenta gradualmente σ. Solo la costellazione si allarga: CH3 continua a mostrare il segnale trasmesso senza rumore.
3. A `σ = 0.35`, il modello dà circa **Es/N₀ = 6.11 dB** e **BER teorico = 0.0217 (2,17%)**. Non è una soglia universale: la probabilità di errore varia in modo continuo.

```text
rI = I/√2 + nI,  rQ = Q/√2 + nQ
nI, nQ ~ N(0, σ²), indipendenti
N₀ = 2σ²
Es/N₀ [dB] = 10·log10(1/(2σ²))
Pb = Qfunc(1/(√2·σ)) = ½·erfc(1/(2σ))
```

`Qfunc` è la funzione di coda della normale standard, distinta dal canale Q. La formula assume QPSK Gray senza codifica, rumore gaussiano indipendente e decisioni coerenti ideali per quadrante. Gli assi indicano tali confini di decisione; il simulatore non recupera bit da CH3 e non conta errori. Il BER visualizzato è una previsione analitica, non una misura della nuvola finita.

Modificare i simboli o σ durante la pausa ricalcola le viste usando gli stessi campioni di rumore normale standard congelati. Ridimensionare lo schermo cambia solo la scala del disegno, non i valori I/Q.

## Limiti del modello

Il rumore viene generato direttamente sui simboli normalizzati, senza demodulare CH3. **Es/N₀ non è OSNR ottico**: non sono definite potenza ottica né banda di riferimento. Non sono simulati FEC, misure Pre-FEC/Post-FEC, recupero del clock, sincronizzazione della portante o non linearità.

Per la convenzione QPSK e la formula del BER: [documentazione tecnica MathWorks](https://www.mathworks.com/help/comm/ref/qpskmodulatorbaseband.html).
