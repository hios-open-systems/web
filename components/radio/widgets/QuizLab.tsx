'use client';

import { useEffect, useMemo, useState } from 'react';
import { QUIZ, type QuizBlock, type QuizQuestion } from '@/lib/radio/quiz';
import { Instrument, Chips, Readouts } from '../ui/Instrument';
import styles from '../radio.module.css';

type Mode = 'A' | 'B' | 'C' | 'D' | 'all' | 'exam';
interface Shown { q: QuizQuestion; order: number[] }
const EXAM_SIZE = 20; const EXAM_SECONDS = 20 * 60; const PASS = 0.7;

function shuffle<T>(a: T[]): T[] {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
  return r;
}

function build(mode: Mode): Shown[] {
  const pool = mode === 'all' || mode === 'exam' ? [...QUIZ] : QUIZ.filter((q) => q.block === (mode as QuizBlock));
  const qs = shuffle(pool).slice(0, mode === 'exam' ? EXAM_SIZE : pool.length);
  return qs.map((q) => ({ q, order: shuffle(q.options.map((_, i) => i)) }));
}

/** Práctica por bloque con explicación, o simulacro cronometrado no oficial. */
export function QuizLab() {
  const [mode, setMode] = useState<Mode>('A');
  const [seed, setSeed] = useState(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- seed rearma la tanda
  const items = useMemo(() => build(mode), [mode, seed]);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [left, setLeft] = useState(EXAM_SECONDS);
  const done = idx >= items.length || (mode === 'exam' && left <= 0);

  useEffect(() => {
    if (mode !== 'exam' || done) return;
    const id = window.setInterval(() => setLeft((s) => s - 1), 1000);
    return () => window.clearInterval(id);
  }, [mode, done]);

  const restart = (m: Mode) => { setMode(m); setSeed((s) => s + 1); setIdx(0); setPicked(null); setScore(0); setLeft(EXAM_SECONDS); };
  const cur = items[idx];
  const choose = (opt: number) => {
    if (picked !== null) return;
    setPicked(opt);
    if (opt === cur.q.answer) setScore((s) => s + 1);
    if (mode === 'exam') window.setTimeout(() => { setPicked(null); setIdx((n) => n + 1); }, 350);
  };
  const pct = items.length ? score / items.length : 0;
  return (
    <Instrument badge="QUIZ" title="Práctica y simulacro" hint="Preguntas escritas por OpenHios a partir del temario Novicio, no el banco oficial de ENACOM. Sirven para entender. El simulacro: 20 preguntas, 20 minutos, sin ver las respuestas hasta el final.">
      <Chips label="Modo" value={mode} onChange={restart} options={[
        { value: 'A', label: 'Bloque A' }, { value: 'B', label: 'Bloque B' }, { value: 'C', label: 'Bloque C' }, { value: 'D', label: 'Bloque D' },
        { value: 'all', label: 'Todo' }, { value: 'exam', label: '⏱ Simulacro' },
      ]} />
      {done ? (
        <div className={styles.screen} style={{ padding: 20, textAlign: 'center' }} aria-live="polite">
          <p style={{ fontSize: '1.6rem', margin: 0, color: pct >= PASS ? '#4ade80' : '#f87171' }}>{score} / {items.length} · {Math.round(pct * 100)} %</p>
          <p style={{ color: '#94a3b8' }}>{pct >= PASS ? 'Bien. Repetí hasta que salga siempre arriba de 90 %.' : 'Volvé a los capítulos y a los simuladores de lo que fallaste.'}</p>
          <button type="button" className={styles.chip} onClick={() => restart(mode)}>↻ Otra tanda</button>
        </div>
      ) : (
        <>
          <p style={{ margin: 0, fontSize: '1.05rem' }}><span style={{ color: '#94a3b8' }}>{idx + 1}/{items.length} · Bloque {cur.q.block} · </span>{cur.q.q}</p>
          <div style={{ display: 'grid', gap: 8 }}>
            {cur.order.map((o) => {
              const show = picked !== null && mode !== 'exam';
              const color = !show ? undefined : o === cur.q.answer ? '#166534' : o === picked ? '#7f1d1d' : undefined;
              return <button key={o} type="button" className={styles.chip} onClick={() => choose(o)} style={{ textAlign: 'left', borderRadius: 10, padding: '10px 14px', background: color }} aria-pressed={picked === o}>{cur.q.options[o]}</button>;
            })}
          </div>
          {picked !== null && mode !== 'exam' ? (
            <div className={styles.chips} style={{ alignItems: 'center' }}>
              <span style={{ color: picked === cur.q.answer ? '#4ade80' : '#f87171' }}>{picked === cur.q.answer ? '✓ Correcto. ' : '✗ No. '}</span>
              <span style={{ color: '#cbd5e1', flex: 1 }}>{cur.q.explain}</span>
              <button type="button" className={styles.chip} onClick={() => { setPicked(null); setIdx((n) => n + 1); }}>Siguiente →</button>
            </div>
          ) : null}
        </>
      )}
      <Readouts items={[
        { label: 'Aciertos', value: `${score}` },
        ...(mode === 'exam' ? [{ label: 'Tiempo', value: `${Math.floor(Math.max(0, left) / 60)}:${String(Math.max(0, left) % 60).padStart(2, '0')}`, tone: (left < 120 ? 'bad' : undefined) as 'bad' | undefined }] : []),
      ]} />
    </Instrument>
  );
}
