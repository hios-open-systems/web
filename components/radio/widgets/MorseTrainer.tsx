'use client';

import { useEffect, useRef, useState } from 'react';
import { KOCH_ORDER, MORSE } from '@/lib/radio/codes';
import { Instrument, Controls, Readouts } from '../ui/Instrument';
import { RangeField } from '../ui/RangeField';
import { playMorse } from './morseAudio';
import styles from '../radio.module.css';

const STORE = 'hios.radio.koch';

function loadLevel(): number {
  try { return Math.max(2, Number(localStorage.getItem(STORE)) || 2); } catch { return 2; }
}

/**
 * Entrenador Koch: escuchás una letra a velocidad real y tocás cuál es.
 * Con 90 % de aciertos en 20 intentos se suma la próxima letra.
 */
export function MorseTrainer() {
  const [level, setLevel] = useState(2);
  const [wpm, setWpm] = useState(18);
  const [target, setTarget] = useState<string | null>(null);
  const [last, setLast] = useState<{ ok: boolean; char: string } | null>(null);
  const [hist, setHist] = useState<boolean[]>([]);
  const stopRef = useRef<(() => void) | null>(null);
  useEffect(() => { setLevel(loadLevel()); return () => stopRef.current?.(); }, []);

  const pool = KOCH_ORDER.slice(0, level).split('');
  const recent = hist.slice(-20);
  const accuracy = recent.length ? recent.filter(Boolean).length / recent.length : 0;

  const play = (ch: string) => {
    stopRef.current?.();
    stopRef.current = playMorse(MORSE[ch], { wpm, farnsworth: wpm, toneHz: 650 }, undefined, () => { stopRef.current = null; });
  };
  const next = () => {
    const ch = pool[Math.floor(Math.random() * pool.length)];
    setTarget(ch); setLast(null); play(ch);
  };
  const answer = (ch: string) => {
    if (!target) return;
    const ok = ch === target;
    const h = [...hist, ok];
    setHist(h); setLast({ ok, char: target }); setTarget(null);
    const r = h.slice(-20);
    if (r.length === 20 && r.filter(Boolean).length >= 18 && level < KOCH_ORDER.length) {
      const nl = level + 1;
      setLevel(nl); setHist([]);
      try { localStorage.setItem(STORE, String(nl)); } catch { /* sin storage */ }
    }
    window.setTimeout(next, ok ? 500 : 1200);
  };

  return (
    <Instrument badge="KOCH" title="Entrenador de Morse (método Koch)" hint="Se aprende por sonido, no contando puntos. Arrancás con 2 letras a velocidad real; al llegar a 90 % se suma otra. Tu nivel queda guardado en este navegador.">
      <div className={styles.screen} style={{ padding: 18, textAlign: 'center', minHeight: 90 }} aria-live="polite">
        {target ? <span style={{ color: '#facc15', fontSize: '1.4rem' }}>¿Qué letra es? 🎧</span>
          : last ? <span style={{ color: last.ok ? '#4ade80' : '#f87171', fontSize: '1.4rem' }}>
            {last.ok ? '✓ ' : '✗ era '}<strong>{last.char}</strong> <span style={{ color: '#94a3b8' }}>{MORSE[last.char].replace(/\./g, '·').replace(/-/g, '−')}</span>
          </span>
          : <span style={{ color: '#94a3b8' }}>Tocá «Empezar» y escuchá.</span>}
      </div>
      <div className={styles.chips}>
        <button type="button" className={styles.chip} onClick={target ? () => play(target) : next}>{target ? '↻ Repetir' : hist.length ? '▶ Siguiente' : '▶ Empezar'}</button>
        {pool.map((ch) => (
          <button key={ch} type="button" className={styles.chip} onClick={() => answer(ch)} disabled={!target} style={{ minWidth: 44, fontFamily: 'var(--font-stack-mono)', fontSize: '1rem' }}>{ch}</button>
        ))}
      </div>
      <Controls>
        <RangeField label="Velocidad" value={wpm} min={10} max={30} step={1} display={`${wpm} ppm`} onChange={setWpm} />
        <RangeField label="Letras en juego (nivel)" value={level} min={2} max={KOCH_ORDER.length} step={1} display={`${level}: ${pool.join(' ')}`} onChange={(v) => { setLevel(v); setHist([]); }} />
      </Controls>
      <Readouts items={[
        { label: 'Aciertos (últimos 20)', value: recent.length ? `${Math.round(accuracy * 100)} % de ${recent.length}` : '—', tone: accuracy >= 0.9 ? 'good' : recent.length > 5 ? 'warn' : undefined },
        { label: 'Próxima letra', value: KOCH_ORDER[level] ?? '¡Completo!' },
      ]} />
    </Instrument>
  );
}
