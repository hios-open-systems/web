import type { ReactNode } from 'react';
import styles from '../radio.module.css';

interface InstrumentProps {
  badge: string;
  title: string;
  hint?: ReactNode;
  children: ReactNode;
}

/** Chasis común de todos los widgets interactivos de la guía. */
export function Instrument({ badge, title, hint, children }: InstrumentProps) {
  return (
    <figure className={styles.instrument} style={{ margin: 0 }} data-radio-instrument={badge}>
      <figcaption className={styles.instrumentHead}>
        <span className={styles.badge}>{badge}</span>
        <span className={styles.instrumentTitle}>{title}</span>
      </figcaption>
      {hint ? <p className={styles.instrumentHint}>{hint}</p> : null}
      {children}
    </figure>
  );
}

export function Screen({ children }: { children: ReactNode }) {
  return <div className={styles.screen}>{children}</div>;
}

export function Controls({ children }: { children: ReactNode }) {
  return <div className={styles.controls}>{children}</div>;
}

export type Tone = 'good' | 'warn' | 'bad' | undefined;

export function Readouts({ items }: { items: ReadonlyArray<{ label: string; value: string; tone?: Tone }> }) {
  return (
    <div className={styles.readouts} aria-live="polite">
      {items.map((item) => (
        <div key={item.label} className={styles.readout} data-tone={item.tone}>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
        </div>
      ))}
    </div>
  );
}

export function Chips<T extends string>({ value, options, onChange, label }: {
  value: T;
  options: ReadonlyArray<{ value: T; label: string }>;
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div className={styles.chips} role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" className={styles.chip} aria-pressed={o.value === value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Grilla de osciloscopio para un viewBox de w × h. */
export function ScopeGrid({ w, h, cols = 10, rows = 8 }: { w: number; h: number; cols?: number; rows?: number }) {
  const lines: ReactNode[] = [];
  for (let i = 1; i < cols; i++) lines.push(<line key={`c${i}`} x1={(w * i) / cols} y1={0} x2={(w * i) / cols} y2={h} />);
  for (let j = 1; j < rows; j++) lines.push(<line key={`r${j}`} x1={0} y1={(h * j) / rows} x2={w} y2={(h * j) / rows} />);
  return (
    <g stroke="var(--scope-grid)" strokeWidth={1} aria-hidden>
      {lines}
      <line x1={0} y1={h / 2} x2={w} y2={h / 2} stroke="var(--scope-axis)" />
    </g>
  );
}
