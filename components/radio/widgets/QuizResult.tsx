import { answerText, type ExamQuestion } from '@/lib/radio/exam';
import styles from '../radio.module.css';

const GOAL = 0.9;

/** Resultado de una tanda: puntaje y repaso de lo que fallaste, con la respuesta. */
export function QuizResult({ score, total, misses, onRestart }: {
  score: number; total: number; misses: ExamQuestion[]; onRestart: () => void;
}) {
  const pct = total ? score / total : 0;
  return (
    <div className={styles.screen} style={{ padding: 20, display: 'grid', gap: 12 }} aria-live="polite">
      <p style={{ fontSize: '1.6rem', margin: 0, textAlign: 'center', color: pct >= GOAL ? '#4ade80' : pct >= 0.7 ? '#facc15' : '#f87171' }}>
        {score} / {total} · {Math.round(pct * 100)} %
      </p>
      <p style={{ color: '#94a3b8', margin: 0, textAlign: 'center' }}>
        {pct >= GOAL ? 'Muy bien. Seguí hasta que salga así siempre.' : 'Apuntá a 90 % o más de forma constante antes de rendir.'}
      </p>
      {misses.length ? (
        <details>
          <summary style={{ cursor: 'pointer', color: '#e2e8f0' }}>Repasar las {misses.length} que fallaste</summary>
          <ol style={{ color: '#cbd5e1', paddingLeft: 20, display: 'grid', gap: 8, marginTop: 10 }}>
            {misses.map((m) => (
              <li key={m.key}>
                <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{m.source}</span><br />
                {m.q} <strong style={{ color: '#4ade80' }}>→ {answerText(m)}</strong>
                {m.warn ? <><br /><span style={{ color: '#facc15', fontSize: '0.85rem' }}>⚠ {m.warn}</span></> : null}
              </li>
            ))}
          </ol>
        </details>
      ) : null}
      <div style={{ textAlign: 'center' }}><button type="button" className={styles.chip} onClick={onRestart}>↻ Otra tanda</button></div>
    </div>
  );
}
