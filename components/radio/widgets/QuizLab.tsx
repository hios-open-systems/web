'use client';

import { useEffect, useMemo, useState } from 'react';
import { buildMock, questionsFor, shuffle, answerText, MOCK_LAYOUT, type ExamPool, type ExamQuestion } from '@/lib/radio/exam';
import { Instrument, Chips, Readouts } from '../ui/Instrument';
import { QuizResult } from './QuizResult';
import styles from '../radio.module.css';

type Mode = ExamPool | 'exam';
/** `order`: índices de opciones en el orden mostrado. */
interface Shown { q: ExamQuestion; order: number[] }
const EXAM_SECONDS = MOCK_LAYOUT.minutes * 60;

function build(mode: Mode): Shown[] {
  const qs = mode === 'exam' ? buildMock() : shuffle(questionsFor(mode));
  // Las oficiales se muestran en su orden: algunas opciones dicen «ninguna es correcta».
  return qs.map((q) => ({ q, order: q.pool === 'D' ? q.options.map((_, i) => i) : shuffle(q.options.map((_, i) => i)) }));
}

const same = (a: number[], b: number[]) => a.length === b.length && a.every((x) => b.includes(x));

/** Práctica con los bancos de examen y simulacro cronometrado. Admite preguntas con varias correctas. */
export function QuizLab() {
  const [mode, setMode] = useState<Mode>('A');
  const [seed, setSeed] = useState(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- seed rearma la tanda
  const items = useMemo(() => build(mode), [mode, seed]);
  const [idx, setIdx] = useState(0);
  const [sel, setSel] = useState<number[]>([]);
  const [checked, setChecked] = useState(false);
  const [misses, setMisses] = useState<ExamQuestion[]>([]);
  const [left, setLeft] = useState(EXAM_SECONDS);
  const done = idx >= items.length || (mode === 'exam' && left <= 0);
  const answered = Math.min(idx, items.length);
  const score = answered - misses.length;

  useEffect(() => {
    if (mode !== 'exam' || done) return;
    const id = window.setInterval(() => setLeft((s) => s - 1), 1000);
    return () => window.clearInterval(id);
  }, [mode, done]);

  const restart = (m: Mode) => { setMode(m); setSeed((s) => s + 1); setIdx(0); setSel([]); setChecked(false); setMisses([]); setLeft(EXAM_SECONDS); };
  const cur = items[idx];
  const multi = (cur?.q.correct.length ?? 0) > 1;
  const next = () => { setSel([]); setChecked(false); setIdx((n) => n + 1); };
  const check = (picked: number[]) => {
    if (!cur || checked) return;
    if (!same(picked, cur.q.correct)) setMisses((m) => [...m, cur.q]);
    if (mode === 'exam') { window.setTimeout(next, 250); setChecked(true); return; }
    setChecked(true);
  };
  const toggle = (i: number) => {
    if (checked) return;
    if (!multi) { setSel([i]); check([i]); return; }
    setSel((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i]));
  };
  const show = checked && mode !== 'exam';
  const ok = cur ? same(sel, cur.q.correct) : false;
  return (
    <Instrument badge="QUIZ" title="Práctica con el banco de examen" hint={`Técnica: banco de Novicio del Cuyo Radio Club (LU1MA). Reglamento: banco oficial de ENACOM, texto literal y respuestas oficiales. Simulacro: ${MOCK_LAYOUT.tecnica} técnicas + ${MOCK_LAYOUT.reglamento} de reglamento en ${MOCK_LAYOUT.minutes} minutos.`}>
      <Chips label="Modo" value={mode} onChange={restart} options={[
        { value: 'A', label: `Técnica A (${questionsFor('A').length})` }, { value: 'B', label: `Técnica B (${questionsFor('B').length})` },
        { value: 'C', label: `Técnica C (${questionsFor('C').length})` }, { value: 'D', label: `Reglamento (${questionsFor('D').length})` },
        { value: 'repaso', label: 'Repaso conceptual' }, { value: 'exam', label: '⏱ Simulacro' },
      ]} />
      {done ? <QuizResult score={score} total={answered} misses={misses} onRestart={() => restart(mode)} /> : (
        <>
          <p style={{ margin: 0, fontSize: '1.05rem' }}>
            <span style={{ color: '#94a3b8', fontFamily: 'var(--font-stack-mono)', fontSize: '0.8rem' }}>{idx + 1}/{items.length} · {cur.q.source}</span><br />{cur.q.q}
            {multi ? <><br /><span style={{ color: '#facc15', fontSize: '0.85rem' }}>Marcá todas las correctas ({cur.q.correct.length}) y confirmá.</span></> : null}
          </p>
          <div style={{ display: 'grid', gap: 8 }}>
            {cur.order.map((i) => {
              const color = !show ? undefined : cur.q.correct.includes(i) ? '#166534' : sel.includes(i) ? '#7f1d1d' : undefined;
              const mark = multi ? (sel.includes(i) ? '☑ ' : '☐ ') : '';
              return <button key={i} type="button" className={styles.chip} onClick={() => toggle(i)} style={{ textAlign: 'left', borderRadius: 10, padding: '10px 14px', background: color, borderColor: sel.includes(i) && !show ? '#22d3ee' : undefined }} aria-pressed={sel.includes(i)}>{mark}{cur.q.options[i]}</button>;
            })}
          </div>
          {multi && !checked ? <div><button type="button" className={styles.chip} disabled={!sel.length} onClick={() => check(sel)}>Confirmar</button></div> : null}
          {show ? (
            <div style={{ display: 'grid', gap: 8 }}>
              <span style={{ color: ok ? '#4ade80' : '#f87171' }}>{ok ? '✓ Correcto.' : `✗ Correcta${multi ? 's' : ''}: ${answerText(cur.q)}.`} <span style={{ color: '#cbd5e1' }}>{cur.q.explain}</span></span>
              {cur.q.warn ? <span style={{ color: '#facc15', fontSize: '0.88rem' }}>⚠ {cur.q.warn}</span> : null}
              <div><button type="button" className={styles.chip} onClick={next}>Siguiente →</button></div>
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
