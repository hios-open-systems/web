import { questionsFor, type ExamPool } from '@/lib/radio/exam';
import { BANK_TECNICA_SOURCE } from '@/lib/radio/bankTecnica';
import { BANK_REGLAMENTO_SOURCE } from '@/lib/radio/bankReglamento';
import styles from './radio.module.css';

/** Lista de estudio: todas las preguntas del banco de examen de un bloque, con su respuesta. */
export function BankList({ pool }: { pool: Exclude<ExamPool, 'repaso'> }) {
  const qs = questionsFor(pool);
  const src = pool === 'D' ? BANK_REGLAMENTO_SOURCE : BANK_TECNICA_SOURCE;
  return (
    <details className={styles.bank}>
      <summary>
        <span className={styles.badge}>EXAMEN</span>
        Las {qs.length} preguntas del banco sobre este bloque, con respuesta
      </summary>
      <p className={styles.bankNote}>
        Parafraseadas de <a href={src.url} target="_blank" rel="noreferrer">{src.name}</a>; el número es el del original.
        {pool === 'D' ? ` Del banco de reglamentación sólo mostramos las que pudimos verificar contra el Reglamento (${qs.length} de ${BANK_REGLAMENTO_SOURCE.novicioTotal}).` : ''}
      </p>
      <ol className={styles.bankList}>
        {qs.map((q) => (
          <li key={q.key}>
            <span className={styles.bankSource}>{q.source}</span>
            <span>{q.q}</span>
            <strong>→ {q.answer}</strong>
            {q.warn ? <em>⚠ {q.warn}</em> : null}
          </li>
        ))}
      </ol>
    </details>
  );
}
