'use client';

import { MorseSoundControls } from './MorseSoundControls';
import { useEffect, useRef, useState } from 'react';
import { textToMorse, morseToText } from '@/lib/radio/codes';
import { Instrument, Controls, Chips } from '../ui/Instrument';
import { RangeField } from '../ui/RangeField';
import { playMorse } from './morseAudio';
import styles from '../radio.module.css';

type Dir = 'toMorse' | 'toText';

/** Traductor texto ↔ Morse con audio, velocidad y tono ajustables. */
export function MorseLab() {
  const [dir, setDir] = useState<Dir>('toMorse');
  const [input, setInput] = useState('CQ CQ DE LU1ABC K');
  const [wpm, setWpm] = useState(18);
  const [fw, setFw] = useState(10);
  const [playing, setPlaying] = useState(-2);
  const stopRef = useRef<(() => void) | null>(null);
  useEffect(() => () => stopRef.current?.(), []);

  const output = dir === 'toMorse' ? textToMorse(input) : morseToText(input);
  // Re-encodes what was understood so that − — · _ play like - and . do.
  const code = dir === 'toMorse' ? output : textToMorse(output);
  const letters = code.split(' ');

  const toggle = () => {
    if (stopRef.current) { stopRef.current(); stopRef.current = null; return; }
    setPlaying(-1);
    stopRef.current = playMorse(code, { wpm, farnsworth: fw }, setPlaying, () => { setPlaying(-2); stopRef.current = null; });
  };
  const swap = (d: Dir) => {
    // Chips also fire for the active option; converting again would corrupt the input.
    if (d === dir) return;
    stopRef.current?.();
    setDir(d);
    setInput(d === 'toMorse' ? morseToText(input) || input : textToMorse(input) || input);
  };

  return (
    <Instrument badge="CW" title="Traductor Morse ↔ texto" hint="Escribí texto o Morse (puntos, rayas, espacio entre letras y / entre palabras). Tocá Escuchar: la letra que suena se ilumina.">
      <Chips label="Dirección" value={dir} onChange={swap} options={[{ value: 'toMorse', label: 'Texto → Morse' }, { value: 'toText', label: 'Morse → texto' }]} />
      <textarea className={styles.textInput} rows={2} value={input} onChange={(e) => setInput(e.target.value)}
        aria-label={dir === 'toMorse' ? 'Texto a traducir' : 'Morse a traducir'} spellCheck={false} />
      <div className={styles.screen} style={{ padding: 14, fontFamily: 'var(--font-stack-mono)', lineHeight: 1.9, minHeight: 64 }} aria-live="polite">
        {dir === 'toMorse' ? letters.map((l, i) => (
          <span key={i} style={{ marginRight: 10, color: i === playing ? '#facc15' : '#22d3ee', fontSize: '1.15rem', textShadow: i === playing ? '0 0 10px #facc15' : 'none' }}>
            {l.replace(/\./g, '·').replace(/-/g, '−')}
          </span>
        )) : <span style={{ color: '#22d3ee', fontSize: '1.2rem', letterSpacing: '0.08em' }}>{output || '—'}</span>}
      </div>
      <div className={styles.chips}>
        <button type="button" className={styles.chip} aria-pressed={playing > -2} onClick={toggle} disabled={!code}>
          {playing > -2 ? '■ Parar' : '▶ Escuchar'}
        </button>
        <button type="button" className={styles.chip} onClick={() => void navigator.clipboard?.writeText(output)}>Copiar resultado</button>
      </div>
      <Controls>
        <RangeField label="Velocidad de caracteres" value={wpm} min={5} max={35} step={1} display={`${wpm} ppm`} onChange={setWpm} />
        <RangeField label="Velocidad efectiva (Farnsworth)" value={Math.min(fw, wpm)} min={3} max={wpm} step={1} display={`${Math.min(fw, wpm)} ppm`} onChange={setFw} />
      </Controls>
      <MorseSoundControls />
    </Instrument>
  );
}
