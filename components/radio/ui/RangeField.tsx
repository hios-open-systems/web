'use client';

import { useId } from 'react';
import styles from '../radio.module.css';

interface RangeFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  /** Texto que se muestra al lado del label. */
  display: string;
  step?: number;
  /** Escala logarítmica: el slider recorre décadas de forma pareja. */
  log?: boolean;
}

const STEPS = 1000;

export function RangeField({ label, value, min, max, onChange, display, step, log = false }: RangeFieldProps) {
  const id = useId();
  const toSlider = (v: number) => (log ? (Math.log(v / min) / Math.log(max / min)) * STEPS : v);
  const fromSlider = (s: number) => (log ? min * (max / min) ** (s / STEPS) : s);
  return (
    <div className={styles.range}>
      <label htmlFor={id}>
        {label}
        <output htmlFor={id}>{display}</output>
      </label>
      <input
        id={id}
        type="range"
        min={log ? 0 : min}
        max={log ? STEPS : max}
        step={log ? 1 : (step ?? (max - min) / 200)}
        value={toSlider(value)}
        onChange={(e) => onChange(fromSlider(Number(e.target.value)))}
        aria-valuetext={display}
      />
    </div>
  );
}
