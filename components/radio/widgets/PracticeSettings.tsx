'use client';

import { useState } from 'react';
import s from '../morsePractice.module.css';

type Mode = 'letter' | 'group' | 'word';

export function usePracticeSettings() {
  const [mode, setMode] = useState<Mode>('letter');
  const [alphabet, setAlphabet] = useState('ET');
  const [words, setWords] = useState('RADIO ANTENA ONDA');
  const [size, setSize] = useState(3);
  const [speed, setSpeed] = useState(8);
  const [manual, setManual] = useState('F');
  return { mode, setMode, alphabet, setAlphabet, words, setWords, size, setSize, speed, setSpeed, manual, setManual };
}

export function PracticeSettings({ settings, reset }: { settings: ReturnType<typeof usePracticeSettings>; reset: () => void }) {
  const { mode, setMode, alphabet, setAlphabet, words, setWords, size, setSize, speed, setSpeed, manual, setManual } = settings;
  return (
    <div className={s.settings} onChange={reset}>
      <label>Ejercicio<select value={mode} onChange={e => setMode(e.target.value as Mode)}>
        <option value="letter">Una letra</option><option value="group">Grupo de letras</option><option value="word">Palabras</option>
      </select></label>
      {mode === 'word'
        ? <label>Palabras para practicar<input value={words} maxLength={120} onChange={e => setWords(e.target.value)} /></label>
        : <label>Letras para practicar<input value={alphabet} maxLength={36} onChange={e => setAlphabet(e.target.value)} /></label>}
      {mode === 'group' && <label>Letras por grupo<select value={size} onChange={e => setSize(Number(e.target.value))}>
        {[2, 3, 4, 5].map(n => <option key={n}>{n}</option>)}</select></label>}
      <label>Tecla manual adicional<select value={manual} onChange={e => setManual(e.target.value)}>
        {Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ').map(c => <option key={c}>{c}</option>)}</select></label>
      <label>Velocidad · {speed} palabras/min<input type="range" min={4} max={35} value={speed}
        onChange={e => setSpeed(Number(e.target.value))} /><small>{speed * 50} pulsos/min · un punto por pulso</small></label>
    </div>
  );
}
