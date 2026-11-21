'use client';

import { useState } from 'react';
import { antennaLength, wavelength } from '@/lib/radio/physics';
import { Instrument, Screen, Controls, Readouts, Chips } from '../ui/Instrument';
import { RangeField } from '../ui/RangeField';
import { si, meters, fmt } from '../ui/format';
import styles from '../radio.module.css';

type Kind = 'dipole' | 'vertical';
const PRESETS = [
  { f: 3.6e6, label: '80 m' }, { f: 7.1e6, label: '40 m' }, { f: 14.2e6, label: '20 m' },
  { f: 28.5e6, label: '10 m' }, { f: 146e6, label: '2 m' }, { f: 435e6, label: '70 cm' },
] as const;
const W = 600; const H = 220; const PERSON = 1.75;

/** Calculadora de dipolo λ/2 y vertical λ/4 dibujada a escala contra una persona. */
export function AntennaLab() {
  const [f, setF] = useState(7.1e6);
  const [kind, setKind] = useState<Kind>('dipole');
  const [k, setK] = useState(0.95);
  const total = antennaLength(f, kind === 'dipole' ? 0.5 : 0.25, k);
  const arm = kind === 'dipole' ? total / 2 : total;
  const horizontalSpan = Math.max(total * 1.25, PERSON * 2.2);
  const verticalSpan = Math.max(PERSON * 1.25, kind === 'vertical' ? total * 1.25 : 0);
  const scale = Math.min((W - 80) / horizontalSpan, (H - 64) / verticalSpan);
  const px = (m: number) => m * scale;
  const cx = kind === 'dipole' ? W / 2 : 120;
  const y = kind === 'dipole' ? 70 : H - 30;
  const curr: string[] = [];
  if (kind === 'dipole') {
    for (let i = -40; i <= 40; i++) { const u = i / 40; curr.push(`${i === -40 ? 'M' : 'L'}${cx + u * px(total / 2)},${y - 28 * Math.cos((u * Math.PI) / 2)}`); }
  } else {
    for (let i = 0; i <= 40; i++) { const u = i / 40; curr.push(`${i === 0 ? 'M' : 'L'}${cx + 26 * Math.cos((u * Math.PI) / 2)},${y - u * px(total)}`); }
  }
  const personH = px(PERSON);
  return (
    <Instrument badge="ANT" title="Calculadora de antenas a escala" hint="Fórmula práctica: largo = λ × fracción × 0,95 (el 0,95 corrige el efecto de puntas). Cortá un poco más largo y ajustá midiendo la ROE.">
      <Chips label="Tipo de antena" value={kind} onChange={setKind} options={[{ value: 'dipole', label: 'Dipolo λ/2' }, { value: 'vertical', label: 'Vertical λ/4 + radiales' }]} />
      <Chips label="Bandas" value={String(f)} onChange={(v) => setF(Number(v))} options={PRESETS.map((p) => ({ value: String(p.f), label: p.label }))} />
      <Screen>
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${kind === 'dipole' ? 'Dipolo' : 'Vertical'} de ${meters(total)}`}>
          <line x1={0} x2={W} y1={H - 30} y2={H - 30} stroke="#334155" />
          {kind === 'dipole' ? (
            <>
              <line x1={cx - px(arm)} x2={cx - 3} y1={y} y2={y} stroke="var(--trace-1)" strokeWidth={4} />
              <line x1={cx + 3} x2={cx + px(arm)} y1={y} y2={y} stroke="var(--trace-1)" strokeWidth={4} />
              <line x1={cx} x2={cx} y1={y} y2={H - 30} stroke="#64748b" strokeDasharray="3 3" />
              <text x={cx + 8} y={y + 22} className={styles.svgLabel}>coaxil + balun 1:1</text>
            </>
          ) : (
            <>
              <line x1={cx} x2={cx} y1={y} y2={y - px(total)} stroke="var(--trace-1)" strokeWidth={4} />
              <line x1={cx} x2={cx - px(total) * 0.7} y1={y} y2={y + 14} stroke="#64748b" strokeWidth={2} />
              <line x1={cx} x2={cx + px(total) * 0.7} y1={y} y2={y + 14} stroke="#64748b" strokeWidth={2} />
            </>
          )}
          <path d={curr.join('')} fill="none" stroke="var(--trace-2)" strokeWidth={1.5} strokeDasharray="5 3" />
          <g transform={`translate(${W - 40}, ${H - 30 - personH})`} fill="#94a3b8">
            <circle cx={0} cy={personH * 0.08} r={personH * 0.08} />
            <rect x={-personH * 0.07} y={personH * 0.17} width={personH * 0.14} height={personH * 0.83} rx={3} />
          </g>
          <text x={W - 40} y={H - 12} textAnchor="middle" className={styles.svgLabel}>1,75 m</text>
          <text x={10} y={18} className={styles.svgStrong} fill="var(--trace-2)">— corriente: máxima en el centro / la base</text>
        </svg>
      </Screen>
      <Controls>
        <RangeField label="Frecuencia" value={f} min={1.8e6} max={450e6} log display={si(f, 'Hz')} onChange={setF} />
        <RangeField label="Factor de acortamiento" value={k} min={0.9} max={1} step={0.005} display={fmt(k, 3)} onChange={setK} />
      </Controls>
      <Readouts items={[
        { label: 'Longitud de onda λ', value: meters(wavelength(f)) },
        { label: kind === 'dipole' ? 'Largo total' : 'Largo del irradiante', value: meters(total), tone: 'good' },
        { label: kind === 'dipole' ? 'Cada rama' : 'Radiales (c/u)', value: meters(kind === 'dipole' ? arm : total) },
        { label: 'Impedancia típica', value: kind === 'dipole' ? '≈ 73 Ω (en espacio libre)' : '≈ 36 Ω (≈ 50 Ω con radiales a 45°)' },
      ]} />
    </Instrument>
  );
}
