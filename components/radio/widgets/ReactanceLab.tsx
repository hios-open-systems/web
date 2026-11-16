'use client';

import { useState } from 'react';
import { inductiveReactance, capacitiveReactance, resonantFrequency } from '@/lib/radio/physics';
import { Instrument, Screen, Controls, Readouts } from '../ui/Instrument';
import { RangeField } from '../ui/RangeField';
import { toPath } from '../ui/useAnimationTime';
import { si } from '../ui/format';
import styles from '../radio.module.css';

const W = 600; const H = 260; const PAD = 36;
const FMIN = 1e5; const FMAX = 1e9; const XMIN = 0.1; const XMAX = 1e5;
const fx = (f: number) => PAD + ((Math.log10(f) - 5) / 4) * (W - PAD - 10);
const xy = (x: number) => H - 24 - ((Math.log10(Math.min(XMAX, Math.max(XMIN, x))) + 1) / 6) * (H - 40);

/** XL sube con f, XC baja con f; donde se cruzan está la resonancia. */
export function ReactanceLab() {
  const [l, setL] = useState(1e-6);
  const [c, setC] = useState(100e-12);
  const [f, setF] = useState(7e6);
  const f0 = resonantFrequency(l, c);
  const xl: [number, number][] = []; const xc: [number, number][] = [];
  for (let e = 5; e <= 9.001; e += 0.05) {
    const fr = 10 ** e;
    xl.push([fx(fr), xy(inductiveReactance(fr, l))]);
    xc.push([fx(fr), xy(capacitiveReactance(fr, c))]);
  }
  const decades = [1e5, 1e6, 1e7, 1e8, 1e9];
  const inView = f0 >= FMIN && f0 <= FMAX;
  return (
    <Instrument badge="XL · XC" title="Reactancia de bobinas y capacitores" hint="Escala logarítmica. Mové L y C: el cruce de las curvas es la frecuencia de resonancia f₀.">
      <Screen>
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Resonancia en ${si(f0, 'Hz')}`}>
          {decades.map((d) => (
            <g key={d}>
              <line x1={fx(d)} x2={fx(d)} y1={10} y2={H - 24} stroke="var(--scope-grid)" />
              <text x={fx(d)} y={H - 8} textAnchor="middle" className={styles.svgLabel}>{si(d, 'Hz', 1)}</text>
            </g>
          ))}
          <path d={toPath(xl)} fill="none" stroke="var(--trace-1)" strokeWidth={2.5} />
          <path d={toPath(xc)} fill="none" stroke="var(--trace-2)" strokeWidth={2.5} />
          <text x={W - 16} y={xy(inductiveReactance(FMAX, l)) + 14} textAnchor="end" className={styles.svgStrong} fill="var(--trace-1)">XL</text>
          <text x={PAD + 6} y={xy(capacitiveReactance(FMIN, c)) + 14} className={styles.svgStrong} fill="var(--trace-2)">XC</text>
          {inView ? <circle cx={fx(f0)} cy={xy(inductiveReactance(f0, l))} r={6} fill="var(--trace-3)" /> : null}
          <line x1={fx(f)} x2={fx(f)} y1={10} y2={H - 24} stroke="var(--trace-4)" strokeDasharray="4 4" />
        </svg>
      </Screen>
      <Controls>
        <RangeField label="Inductancia L" value={l} min={10e-9} max={100e-6} log display={si(l, 'H')} onChange={setL} />
        <RangeField label="Capacidad C" value={c} min={1e-12} max={10e-9} log display={si(c, 'F')} onChange={setC} />
        <RangeField label="Frecuencia de prueba" value={f} min={FMIN} max={FMAX} log display={si(f, 'Hz')} onChange={setF} />
      </Controls>
      <Readouts items={[
        { label: 'XL = 2πfL', value: si(inductiveReactance(f, l), 'Ω'), tone: undefined },
        { label: 'XC = 1/(2πfC)', value: si(capacitiveReactance(f, c), 'Ω') },
        { label: 'f₀ = 1/(2π√LC)', value: si(f0, 'Hz'), tone: 'good' },
      ]} />
    </Instrument>
  );
}
