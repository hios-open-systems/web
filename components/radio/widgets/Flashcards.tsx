'use client';

import { useMemo, useState } from 'react';
import { PHONETIC, Q_CODES, MORSE } from '@/lib/radio/codes';
import { Instrument, Chips, Readouts } from '../ui/Instrument';
import styles from '../radio.module.css';

type Deck = 'phonetic' | 'q' | 'morse';
interface Card { front: string; back: string }

const DECKS: Record<Deck, Card[]> = {
  phonetic: PHONETIC.map(([l, w]) => ({ front: l, back: w })),
  q: Q_CODES.map((c) => ({ front: c.code, back: `${c.statement}  ·  Pregunta: ${c.question}` })),
  morse: PHONETIC.map(([l]) => ({ front: MORSE[l].replace(/\./g, '·').replace(/-/g, '−'), back: l })),
};

function shuffled<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

/** Tarjetas para memorizar alfabeto fonético, código Q y Morse visual. */
export function Flashcards() {
  const [deck, setDeck] = useState<Deck>('phonetic');
  const [seed, setSeed] = useState(0);
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- seed fuerza un nuevo orden
  const cards = useMemo(() => shuffled(DECKS[deck]), [deck, seed]);
  const card = cards[i % cards.length];
  const go = (gotIt: boolean) => { if (gotIt) setKnown((k) => k + 1); setFlipped(false); setI((n) => n + 1); };
  const reset = (d: Deck) => { setDeck(d); setI(0); setKnown(0); setFlipped(false); setSeed((s) => s + 1); };
  return (
    <Instrument badge="FICHAS" title="Tarjetas de memoria" hint="Pensá la respuesta, dala vuelta y sé honesto. Las que no sabés vuelven a salir en la próxima ronda.">
      <Chips label="Mazo" value={deck} onChange={reset} options={[{ value: 'phonetic', label: 'Alfabeto fonético' }, { value: 'q', label: 'Código Q' }, { value: 'morse', label: 'Morse → letra' }]} />
      <button type="button" onClick={() => setFlipped((f) => !f)} className={styles.screen}
        style={{ minHeight: 150, display: 'grid', placeItems: 'center', padding: 20, cursor: 'pointer', color: '#e2e8f0', width: '100%' }}
        aria-label={flipped ? `Respuesta: ${card.back}` : `Tarjeta: ${card.front}. Tocá para ver la respuesta`}>
        {flipped
          ? <span style={{ fontSize: '1.2rem', color: '#4ade80', textAlign: 'center' }}>{card.back}</span>
          : <span style={{ fontSize: '2.4rem', fontFamily: 'var(--font-stack-mono)', color: '#22d3ee' }}>{card.front}</span>}
      </button>
      <div className={styles.chips}>
        <button type="button" className={styles.chip} onClick={() => go(false)} disabled={!flipped}>✗ No la sabía</button>
        <button type="button" className={styles.chip} onClick={() => go(true)} disabled={!flipped}>✓ La sabía</button>
        <button type="button" className={styles.chip} onClick={() => reset(deck)}>↻ Mezclar</button>
      </div>
      <Readouts items={[
        { label: 'Tarjeta', value: `${(i % cards.length) + 1} / ${cards.length}` },
        { label: 'Sabías', value: `${known} de ${i}`, tone: i && known / i > 0.8 ? 'good' : undefined },
      ]} />
    </Instrument>
  );
}
