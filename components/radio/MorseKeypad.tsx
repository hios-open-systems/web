'use client';

import { useEffect, useRef, useState } from 'react';
import { textToMorse } from '@/lib/radio/codes';
import { MorseTable } from './MorseTable';
import { playMorse, type MorseTiming } from './widgets/morseAudio';
import styles from './teach.module.css';

const TIMING: MorseTiming = { wpm: 18, farnsworth: 12, toneHz: 650 };

/** Tabla Morse interactiva: tocar una celda la hace sonar y la suma a un mensaje que se puede escuchar entero. */
export function MorseKeypad() {
  const [msg, setMsg] = useState('');
  const [sound, setSound] = useState(true);
  const [active, setActive] = useState<string>();
  const [playing, setPlaying] = useState(-1);
  const stopRef = useRef<(() => void) | null>(null);
  useEffect(() => () => stopRef.current?.(), []);

  const stop = () => { stopRef.current?.(); stopRef.current = null; };
  const play = (code: string, onLetter?: (i: number) => void, onEnd?: () => void) => {
    stop();
    stopRef.current = playMorse(code, TIMING, onLetter, () => { stopRef.current = null; onEnd?.(); });
  };
  const pick = (text: string, code: string) => {
    setMsg((m) => m + text);
    if (!sound) return;
    setActive(text);
    play(code, undefined, () => setActive(undefined));
  };

  const code = textToMorse(msg);
  const letters = code ? code.split(' ') : [];
  const playAll = () => {
    if (stopRef.current) { stop(); return; }
    setPlaying(0);
    play(code, setPlaying, () => setPlaying(-1));
  };

  return (
    <div className={styles.keypad}>
      <div className={styles.composer} aria-live="polite">
        <div className={styles.composerText}>{msg || <span>Tocá letras de la tabla para escribir un mensaje</span>}</div>
        <div className={styles.composerCode}>
          {letters.map((l, i) => <span key={i} data-on={i === playing ? '' : undefined}>{l === '/' ? '/' : l.replace(/\./g, '·').replace(/-/g, '−')}</span>)}
        </div>
        <div className={styles.composerBar}>
          <button type="button" onClick={playAll} disabled={!code}>{playing >= 0 ? '■ Parar' : '▶ Escuchar'}</button>
          <button type="button" onClick={() => setMsg((m) => (m.endsWith(' ') || !m ? m : `${m} `))}>Espacio</button>
          <button type="button" onClick={() => setMsg((m) => m.slice(0, -1))} disabled={!msg} aria-label="Borrar la última letra">⌫</button>
          <button type="button" onClick={() => { stop(); setPlaying(-1); setMsg(''); }} disabled={!msg}>Limpiar</button>
          <button type="button" onClick={() => void navigator.clipboard?.writeText(code)} disabled={!code}>Copiar</button>
          <label><input type="checkbox" checked={sound} onChange={(e) => setSound(e.target.checked)} /> Sonido</label>
        </div>
      </div>
      <MorseTable onPick={pick} active={active} />
    </div>
  );
}
