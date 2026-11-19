import { OFFICIAL_BAND_PLAN, type PlanBand } from '@/lib/radio/bandPlan';
import { OFFICIAL_PLAN_SOURCE } from '@/lib/radio/sources';
import styles from './teach.module.css';

const LABEL = { si: 'Novicio: toda la banda', parcial: 'Novicio: algunos tramos', no: 'Novicio: no' } as const;

function access(b: PlanBand): keyof typeof LABEL {
  const rows = b.rows.filter((r) => r.cats);
  const n = rows.filter((r) => r.cats.includes('N')).length;
  return n === rows.length ? 'si' : n ? 'parcial' : 'no';
}

/** Plan de Bandas oficial (Anexo A), tabla por banda, con la columna de Novicio destacada. */
export function BandPlanTable() {
  return (
    <div className={styles.plan}>
      <p className={styles.planNote}>
        Fuente: <a href={OFFICIAL_PLAN_SOURCE.url} target="_blank" rel="noreferrer">{OFFICIAL_PLAN_SOURCE.name}</a>.
        N = Novicio, G = General, S = Superior. Los límites de cada tramo no se usan para transmitir (Anexo A, punto 2).
      </p>
      {OFFICIAL_BAND_PLAN.map((b, i) => {
        const a = access(b);
        return (
          <details key={`${b.name}-${i}`} className={styles.planBand} data-access={a}>
            <summary>
              <strong>{b.name}</strong>
              <span>{b.rows[0].from}–{b.rows[b.rows.length - 1].to} {b.unit}</span>
              <span className={styles.planStatus}>{b.status}</span>
              <span className={styles.planAccess}>{LABEL[a]}</span>
            </summary>
            <div className={styles.planScroll}>
              <table>
                <thead><tr><th>Desde</th><th>Hasta</th><th>Modos y usos</th><th>N</th><th>G</th><th>S</th></tr></thead>
                <tbody>
                  {b.rows.map((r) => (
                    <tr key={r.from + r.to} data-novicio={r.cats.includes('N') ? 'si' : 'no'}>
                      <td>{r.from}</td><td>{r.to}</td><td>{r.dest}</td>
                      {['N', 'G', 'S'].map((c) => <td key={c}>{r.cats.includes(c) ? '✓' : '—'}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {b.notes.length ? <ol className={styles.planNotes}>{b.notes.map((n) => <li key={n}>{n}</li>)}</ol> : null}
          </details>
        );
      })}
    </div>
  );
}
