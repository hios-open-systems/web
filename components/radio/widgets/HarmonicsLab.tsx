'use client';

import { useState } from 'react';
import { butterworthLossDb } from '@/lib/radio/physics';
import { Instrument, Screen, Controls, Readouts } from '../ui/Instrument';
import { RangeField } from '../ui/RangeField';
import { toPath } from '../ui/useAnimationTime';
import { si, fmt } from '../ui/format';
import styles from '../radio.module.css';

const W = 600; const H = 260; const TOP = 14; const FLOOR = -90;
/** Nivel típico de armónicas a la salida de un PA clase C sin filtrar (dBc). */
const RAW = [0, -15, -20, -28, -32];
const yDb = (d: number) => TOP + (Math.min(0, Math.max(FLOOR, d)) / FLOOR) * (H - TOP - 28);

/** Espectro de un transmisor: portadora + armónicas, antes y después del LPF. */
export function HarmonicsLab() {
  const [fc, setFc] = useState(146e6);
  const [cutRatio, setCutRatio] = useState(1.3);
  const [order, setOrder] = useState(5);
  const cutoff = fc * cutRatio;
  const fMax = fc * 5.5;
  const x = (f: number) => 20 + (f / fMax) * (W - 40);
  const curve: [number, number][] = [];
  for (let f = fMax / 300; f <= fMax; f += fMax / 300) curve.push([x(f), yDb(-butterworthLossDb(f, cutoff, order))]);
  const out = RAW.map((lvl, i) => lvl - butterworthLossDb(fc * (i + 1), cutoff, order));
  const worst = Math.max(...out.slice(1));
  return (
    <Instrument badge="LPF" title="Por qué va un filtro pasa-bajos antes de la antena" hint="Barras grises: armónicas que salen del amplificador. Barras de color: lo que queda después del filtro. Ajustá el orden y el corte.">
      <Screen>
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Peor armónica ${fmt(worst)} dBc`}>
          {[0, -20, -40, -60, -80].map((d) => (
            <g key={d}>
              <line x1={20} x2={W - 20} y1={yDb(d)} y2={yDb(d)} stroke="var(--scope-grid)" />
              <text x={W - 18} y={yDb(d) - 3} textAnchor="end" className={styles.svgLabel}>{d} dB</text>
            </g>
          ))}
          <path d={toPath(curve)} fill="none" stroke="var(--trace-4)" strokeWidth={2} strokeDasharray="6 4" />
          {RAW.map((lvl, i) => {
            const xi = x(fc * (i + 1));
            return (
              <g key={i}>
                <rect x={xi - 9} y={yDb(lvl)} width={8} height={H - 28 - yDb(lvl)} fill="#475569" />
                <rect x={xi + 1} y={yDb(out[i])} width={8} height={Math.max(0, H - 28 - yDb(out[i]))} fill={i === 0 ? 'var(--trace-1)' : out[i] > -60 ? '#f87171' : 'var(--trace-4)'} />
                <text x={xi} y={H - 10} textAnchor="middle" className={styles.svgLabel}>{i === 0 ? 'f' : `${i + 1}f`}</text>
              </g>
            );
          })}
        </svg>
      </Screen>
      <Controls>
        <RangeField label="Portadora" value={fc} min={1.8e6} max={450e6} log display={si(fc, 'Hz')} onChange={setFc} />
        <RangeField label="Corte del filtro (× portadora)" value={cutRatio} min={1.05} max={2.5} step={0.05} display={`${fmt(cutRatio)} × = ${si(cutoff, 'Hz')}`} onChange={setCutRatio} />
        <RangeField label="Orden (cantidad de L y C)" value={order} min={1} max={9} step={1} display={`${order}`} onChange={setOrder} />
      </Controls>
      <Readouts items={[
        { label: 'Pérdida en la portadora', value: `${fmt(butterworthLossDb(fc, cutoff, order), 2)} dB`, tone: butterworthLossDb(fc, cutoff, order) > 1 ? 'warn' : 'good' },
        { label: 'Peor armónica', value: `${fmt(worst, 3)} dBc`, tone: worst > -60 ? 'bad' : 'good' },
        { label: 'Objetivo orientativo', value: '≤ -60 dBc' },
      ]} />
    </Instrument>
  );
}
