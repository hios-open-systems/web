'use client';

import { useEffect, useMemo, useState } from 'react';
import { buildMock, questionsFor, shuffle, MOCK_LAYOUT, type ExamPool, type ExamQuestion } from '@/lib/radio/exam';
import { Instrument, Chips, Readouts } from '../ui/Instrument';
import { QuizResult } from './QuizResult';
import styles from '../radio.module.css';

type Mode = ExamPool | 'exam';
interface Shown { q: ExamQuestion; options: string[] }
const EXAM_SECONDS = MOCK_LAYOUT.minutes * 60;

function build(mode: Mode): Shown[] {
  const qs = mode === 'exam' ? buildMock() : shuffle(questionsFor(mode));
  return qs.map((q) => ({ q, options: shuffle([q.answer, ...q.wrong]) }));
}

/** Práctica con los bancos reales (técnico y reglamentación) y simulacro cronometrado. */
export function QuizLab() {
  const [mode, setMode] = useState<Mode>('A');
  const [seed, setSeed] = useState(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- seed rearma la tanda
  const items = useMemo(() => build(mode), [mode, seed]);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [misses, setMisses] = useState<ExamQuestion[]>([]);
  const [left, setLeft] = useState(EXAM_SECONDS);
  const done = idx >= items.length || (mode === 'exam' && left <= 0);
  const answered = mode === 'exam' && left <= 0 ? idx : Math.min(idx, items.length);
  const score = answered - misses.length;

  useEffect(() => {
    if (mode !== 'exam' || done) return;
    const id = window.setInterval(() => setLeft((s) => s - 1), 1000);
    return () => window.clearInterval(id);
  }, [mode, done]);

  const restart = (m: Mode) => { setMode(m); setSeed((s) => s + 1); setIdx(0); setPicked(null); setMisses([]); setLeft(EXAM_SECONDS); };
  const cur = items[idx];
  const choose = (opt: string) => {
    if (picked !== null || !cur) return;
    setPicked(opt);
    if (opt !== cur.q.answer) setMisses((m) => [...m, cur.q]);
    if (mode === 'exam') window.setTimeout(() => { setPicked(null); setIdx((n) => n + 1); }, 300);
  };
  const show = picked !== null && mode !== 'exam';
  return (
    <Instrument badge="QUIZ" title="Práctica con el banco de examen" hint={`Preguntas del banco técnico de Novicio (150, Cuyo Radio Club LU1MA) y del banco de Reglamentación de ENACOM (Res. 508/2018), parafraseadas y con su número para buscarlas en el original. Simulacro: ${MOCK_LAYOUT.tecnica} técnicas + ${MOCK_LAYOUT.reglamento} de reglamento en ${MOCK_LAYOUT.minutes} minutos.`}>
      <Chips label="Modo" value={mode} onChange={restart} options={[
        { value: 'A', label: `Técnica A (${questionsFor('A').length})` }, { value: 'B', label: `Técnica B (${questionsFor('B').length})` },
        { value: 'C', label: `Técnica C (${questionsFor('C').length})` }, { value: 'D', label: `Reglamento (${questionsFor('D').length})` },
        { value: 'repaso', label: 'Repaso conceptual' }, { value: 'exam', label: '⏱ Simulacro' },
      ]} />
      {done ? <QuizResult score={score} total={answered} misses={misses} onRestart={() => restart(mode)} /> : (
        <>
          <p style={{ margin: 0, fontSize: '1.05rem' }}>
            <span style={{ color: '#94a3b8', fontFamily: 'var(--font-stack-mono)', fontSize: '0.8rem' }}>{idx + 1}/{items.length} · {cur.q.source}</span><br />{cur.q.q}
          </p>
          <div style={{ display: 'grid', gap: 8 }}>
            {cur.options.map((o) => {
              const color = !show ? undefined : o === cur.q.answer ? '#166534' : o === picked ? '#7f1d1d' : undefined;
              return <button key={o} type="button" className={styles.chip} onClick={() => choose(o)} style={{ textAlign: 'left', borderRadius: 10, padding: '10px 14px', background: color }} aria-pressed={picked === o}>{o}</button>;
            })}
          </div>
          {show ? (
            <div style={{ display: 'grid', gap: 8 }}>
              <span style={{ color: picked === cur.q.answer ? '#4ade80' : '#f87171' }}>{picked === cur.q.answer ? '✓ Correcto.' : `✗ Era: ${cur.q.answer}.`} <span style={{ color: '#cbd5e1' }}>{cur.q.explain}</span></span>
              {cur.q.warn ? <span style={{ color: '#facc15', fontSize: '0.88rem' }}>⚠ {cur.q.warn}</span> : null}
              <div><button type="button" className={styles.chip} onClick={() => { setPicked(null); setIdx((n) => n + 1); }}>Siguiente →</button></div>
            </div>
          ) : null}
        </>
      )}
      <Readouts items={[
        { label: 'Aciertos', value: `${score} / ${answered}` },
        ...(mode === 'exam' ? [{ label: 'Tiempo', value: `${Math.floor(Math.max(0, left) / 60)}:${String(Math.max(0, left) % 60).padStart(2, '0')}`, tone: (left < 300 ? 'bad' : undefined) as 'bad' | undefined }] : []),
      ]} />
    </Instrument>
  );
}
