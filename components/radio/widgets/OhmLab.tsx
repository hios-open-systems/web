'use client';

import { useState } from 'react';
import { solveOhm, type OhmKey } from '@/lib/radio/physics';
import { Instrument, Screen, Controls, Readouts, Chips } from '../ui/Instrument';
import { RangeField } from '../ui/RangeField';
import { si } from '../ui/format';
import styles from '../radio.module.css';

type Pair = 'vr' | 'vi' | 'pr' | 'pi';
const PAIRS: Record<Pair, [OhmKey, OhmKey]> = { vr: ['v', 'r'], vi: ['v', 'i'], pr: ['p', 'r'], pi: ['p', 'i'] };
const META: Record<OhmKey, { label: string; unit: string; min: number; max: number }> = {
  v: { label: 'Tensión V', unit: 'V', min: 0.1, max: 1000 },
  i: { label: 'Corriente I', unit: 'A', min: 0.001, max: 20 },
  r: { label: 'Resistencia R', unit: 'Ω', min: 1, max: 10000 },
  p: { label: 'Potencia P', unit: 'W', min: 0.01, max: 1000 },
};

/** Ley de Ohm y de Watt: elegís dos magnitudes, el circuito muestra las otras. */
export function OhmLab() {
  const [pair, setPair] = useState<Pair>('vr');
  const [vals, setVals] = useState<Record<OhmKey, number>>({ v: 13.8, i: 1, r: 50, p: 100 });
  const [a, b] = PAIRS[pair];
  const res = solveOhm(a, vals[a], b, vals[b]);
  const flow = res ? Math.min(6, Math.max(0.3, Math.log10(res.i * 1000 + 1) * 1.6)) : 0;
  const glow = res ? Math.min(1, Math.log10(res.p + 1) / 3) : 0;
  const field = (k: OhmKey) => (
    <RangeField key={k} label={META[k].label} value={vals[k]} min={META[k].min} max={META[k].max} log
      display={si(vals[k], META[k].unit)} onChange={(v) => setVals((s) => ({ ...s, [k]: v }))} />
  );
  return (
    <Instrument badge="OHM" title="Ley de Ohm y potencia" hint="Elegí qué dos datos conocés. Los puntos son la corriente; el brillo de la resistencia es la potencia que se vuelve calor.">
      <Chips label="Datos conocidos" value={pair} onChange={setPair} options={[
        { value: 'vr', label: 'V y R' }, { value: 'vi', label: 'V e I' }, { value: 'pr', label: 'P y R' }, { value: 'pi', label: 'P e I' },
      ]} />
      <Screen>
        <svg viewBox="0 0 520 200" role="img" aria-label="Circuito con fuente y resistencia">
          <rect x={60} y={40} width={400} height={120} rx={8} fill="none" stroke="#334155" strokeWidth={3} />
          <rect x={60} y={40} width={400} height={120} rx={8} fill="none" stroke="var(--trace-1)" strokeWidth={3}
            strokeDasharray="4 18" style={{ animation: res ? `radioFlow ${3 / flow}s linear infinite` : 'none' }} />
          <circle cx={60} cy={100} r={26} fill="#0b1016" stroke="var(--trace-2)" strokeWidth={2} />
          <text x={60} y={105} textAnchor="middle" className={styles.svgStrong}>V</text>
          <rect x={300} y={140} width={80} height={40} rx={6} fill={`rgba(248,113,113,${0.15 + glow * 0.85})`} stroke="#f87171" strokeWidth={2}
            style={{ filter: `drop-shadow(0 0 ${glow * 16}px #f87171)` }} />
          <text x={340} y={165} textAnchor="middle" className={styles.svgStrong}>R</text>
          <text x={260} y={30} textAnchor="middle" className={styles.svgLabel}>I = {res ? si(res.i, 'A') : '—'} →</text>
          <style>{'@keyframes radioFlow { to { stroke-dashoffset: -44; } }'}</style>
        </svg>
      </Screen>
      <Controls>{[a, b].map(field)}</Controls>
      <Readouts items={(['v', 'i', 'r', 'p'] as const).map((k) => ({ label: META[k].label, value: res ? si(res[k], META[k].unit) : '—', tone: k === a || k === b ? undefined : 'good' }))} />
    </Instrument>
  );
}
