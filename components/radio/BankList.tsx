import { questionsFor, answerText, type ExamPool } from '@/lib/radio/exam';
import { BANK_TECNICA_SOURCE } from '@/lib/radio/bankTecnica';
import { OFFICIAL_SKIPPED } from '@/lib/radio/officialBank';
import { OFFICIAL_BANK_SOURCE } from '@/lib/radio/sources';
import styles from './radio.module.css';

/** Lista de estudio: todas las preguntas del banco de examen de un bloque, con su respuesta. */
export function BankList({ pool }: { pool: Exclude<ExamPool, 'repaso'> }) {
  const qs = questionsFor(pool);
  const official = pool === 'D';
  const src = official ? OFFICIAL_BANK_SOURCE : BANK_TECNICA_SOURCE;
  return (
    <details className={styles.bank}>
      <summary>
        <span className={styles.badge}>EXAMEN</span>
        Las {qs.length} preguntas del banco sobre este bloque, con respuesta
      </summary>
      <p className={styles.bankNote}>
        {official
          ? <>Texto literal del <a href={src.url} target="_blank" rel="noreferrer">{src.name}</a>, con las respuestas de su tabla oficial. Algunas tienen más de una opción correcta. Quedaron afuera: {OFFICIAL_SKIPPED.join('; ')}.</>
          : <>Parafraseadas de <a href={src.url} target="_blank" rel="noreferrer">{src.name}</a>; el número es el del original.</>}
      </p>
      <ol className={styles.bankList}>
        {qs.map((q) => (
          <li key={q.key}>
            <span className={styles.bankSource}>{q.source}</span>
            <span>{q.q}</span>
            <strong>→ {answerText(q)}</strong>
            {q.warn ? <em>⚠ {q.warn}</em> : null}
          </li>
        ))}
      </ol>
    </details>
  );
}
