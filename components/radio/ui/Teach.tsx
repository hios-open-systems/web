import type { ReactNode } from 'react';
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
export function Eq({ children, vars }: { children: ReactNode; vars?: ReadonlyArray<readonly [string, string]> }) {
  return (
    <div className={styles.eq}>
      <code>{children}</code>
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
      <ol>{steps.map((s) => <li key={s}><code>{s}</code></li>)}</ol>
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
