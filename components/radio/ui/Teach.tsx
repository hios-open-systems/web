import type { ReactNode } from 'react';
import { MathLine } from '@/components/common/MathLine';
import { Widget, type WidgetName } from '../widgets/Widget';
import styles from '../teach.module.css';

/** Definición formal: magnitud, símbolo y unidad, y una oración que la define. */
export function Def({ term, symbol, unit, children }: { term: string; symbol?: string; unit?: string; children: ReactNode }) {
  return (
    <div className={styles.def}>
      <dt>
        <strong>{term}</strong>
        {symbol ? <span className={styles.sym}>{symbol}</span> : null}
        {unit ? <span className={styles.unit}>[{unit}]</span> : null}
      </dt>
      <dd>{children}</dd>
    </div>
  );
}

export function Defs({ children }: { children: ReactNode }) {
  return <dl className={styles.defs}>{children}</dl>;
}

/** Ecuación con la lista de variables y sus unidades. */
export function Eq({ children, lines, vars }: { children?: ReactNode; lines?: readonly string[]; vars?: ReadonlyArray<readonly [string, string]> }) {
  return (
    <div className={styles.eq}>
      {(lines ?? [children]).map((line, index) => <MathLine key={index}>{line}</MathLine>)}
      {vars ? (
        <ul>
          {vars.map(([v, d]) => (
            <li key={v}><code>{v}</code> {d}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/** Ejemplo resuelto: datos, pasos y resultado. */
export function Example({ title, steps, result }: { title: string; steps: ReadonlyArray<string>; result: string }) {
  return (
    <div className={styles.example}>
      <span className={styles.exampleTag}>Ejemplo</span>
      <p>{title}</p>
      <ol>{steps.map((s) => <li key={s}><MathLine>{s}</MathLine></li>)}</ol>
      <p className={styles.result}>{result}</p>
    </div>
  );
}

export function Fig({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <figure className={styles.fig}>
      {children}
      <figcaption>{caption}</figcaption>
    </figure>
  );
}

/** Puntos clave para el examen. */
export function Key({ children }: { children: ReactNode }) {
  return (
    <div className={styles.key}>
      <span className={styles.keyTag}>Para el examen</span>
      {children}
    </div>
  );
}

/** El simulador queda como extra plegado, no como explicación principal. */
export function Sim({ name, label }: { name: WidgetName; label: string }) {
  return (
    <details className={styles.sim}>
      <summary>Simulador: {label}</summary>
      <Widget name={name} />
    </details>
  );
}

/** Tabla simple de referencia. */
export function Table({ head, rows, cite }: { head: ReadonlyArray<string>; rows: ReadonlyArray<ReadonlyArray<string>>; cite?: string }) {
  return (
    <div className={styles.table}>
      <table>
        <thead><tr>{head.map((h) => <th key={h}>{h}</th>)}</tr></thead>
        <tbody>{rows.map((r) => <tr key={r.join('|')}>{r.map((c, i) => <td key={i}>{c}</td>)}</tr>)}</tbody>
      </table>
      {cite ? <p className={styles.cite}>{cite}</p> : null}
    </div>
  );
}

/** Cita de la fuente de un dato (artículo o pregunta del banco oficial). */
export function Cite({ children }: { children: ReactNode }) {
  return <span className={styles.cite}>{children}</span>;
}
