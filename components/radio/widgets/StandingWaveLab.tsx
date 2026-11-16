'use client';

import { useState } from 'react';
import { reflection, magnitude, swr, returnLossDb, reflectedPowerFraction } from '@/lib/radio/physics';
import { Instrument, Screen, Controls, Readouts, Chips } from '../ui/Instrument';
import { RangeField } from '../ui/RangeField';
import { useAnimationTime, toPath } from '../ui/useAnimationTime';
import { fmt } from '../ui/format';
import styles from '../radio.module.css';

const W = 600; const H = 230; const MID = 110; const A = 42;
const PRESETS = [
  { value: 'match', label: '50 Ω (adaptada)', r: 50, x: 0 },
  { value: '100', label: '100 Ω', r: 100, x: 0 },
  { value: '25', label: '25 Ω', r: 25, x: 0 },
  { value: 'reactive', label: '50 + j50 Ω', r: 50, x: 50 },
  { value: 'open', label: 'Abierto', r: 1e6, x: 0 },
  { value: 'short', label: 'Corto', r: 0, x: 0 },
] as const;

/** Onda directa, reflejada y estacionaria en un coaxil de 50 Ω. */
export function StandingWaveLab() {
  const [r, setR] = useState(100);
  const [x, setX] = useState(0);
  const [power, setPower] = useState(100);
  const t = useAnimationTime();
  const g = reflection({ re: r, im: x });
  const mag = magnitude(g);
  const phase = Math.atan2(g.im, g.re);
  const k = (2 * Math.PI * 2) / W; // 2 longitudes de onda en pantalla
  const w = 2 * Math.PI * 0.6;
  const fwd: [number, number][] = []; const ref: [number, number][] = []; const sum: [number, number][] = [];
  const envHi: [number, number][] = []; const envLo: [number, number][] = [];
  for (let px = 0; px <= W; px += 3) {
    const d = W - px; // distancia a la carga
    const vf = Math.cos(w * t + k * d);
    const vr = mag * Math.cos(w * t - k * d + phase);
    const env = Math.hypot(1 + mag * Math.cos(phase - 2 * k * d), mag * Math.sin(phase - 2 * k * d));
    fwd.push([px, MID - A * vf]); ref.push([px, MID - A * vr]); sum.push([px, MID - A * (vf + vr)]);
    envHi.push([px, MID - A * env]); envLo.push([px, MID + A * env]);
  }
  const s = swr(mag);
  const refl = reflectedPowerFraction(mag);
  const preset = PRESETS.find((p) => p.r === r && p.x === x)?.value ?? '';
  return (
    <Instrument badge="ROE" title="Ondas estacionarias en el coaxil" hint="Celeste: onda que va a la antena. Rosa: la que vuelve. Amarillo: lo que medís en la línea (la suma). Con 50 Ω no vuelve nada.">
      <Chips label="Carga" value={preset} onChange={(v) => { const p = PRESETS.find((q) => q.value === v); if (p) { setR(p.r); setX(p.x); } }} options={PRESETS.map((p) => ({ value: p.value, label: p.label }))} />
      <Screen>
        <svg viewBox={`0 0 ${W + 40} ${H}`} role="img" aria-label={`ROE ${fmt(s)}:1`}>
          <rect x={0} y={MID - 58} width={W} height={116} fill="#0b1016" />
          <path d={toPath(envHi)} fill="none" stroke="var(--trace-2)" strokeOpacity={0.35} strokeDasharray="4 4" />
          <path d={toPath(envLo)} fill="none" stroke="var(--trace-2)" strokeOpacity={0.35} strokeDasharray="4 4" />
          <path d={toPath(fwd)} fill="none" stroke="var(--trace-1)" strokeWidth={1.5} opacity={0.7} />
          <path d={toPath(ref)} fill="none" stroke="var(--trace-3)" strokeWidth={1.5} opacity={0.7} />
          <path d={toPath(sum)} fill="none" stroke="var(--trace-2)" strokeWidth={2.5} />
          <rect x={W} y={MID - 30} width={34} height={60} rx={4} fill={mag < 0.2 ? '#166534' : '#7f1d1d'} stroke="#94a3b8" />
          <text x={W + 17} y={MID + 4} textAnchor="middle" className={styles.svgStrong}>Z</text>
          <text x={4} y={H - 30} className={styles.svgLabel}>← transmisor</text>
          <text x={W - 4} y={H - 30} textAnchor="end" className={styles.svgLabel}>antena →</text>
          <rect x={4} y={H - 20} width={(W - 8) * Math.min(1, (s - 1) / 9)} height={10} rx={3} fill={s < 1.5 ? '#4ade80' : s < 3 ? '#facc15' : '#f87171'} />
        </svg>
      </Screen>
      <Controls>
        <RangeField label="Resistencia de la antena" value={Math.max(1, Math.min(1000, r))} min={1} max={1000} log display={`${fmt(r)} Ω`} onChange={setR} />
        <RangeField label="Reactancia (X)" value={x} min={-200} max={200} step={1} display={`${x >= 0 ? '+' : ''}${fmt(x)} Ω`} onChange={setX} />
        <RangeField label="Potencia directa" value={power} min={1} max={200} step={1} display={`${fmt(power)} W`} onChange={setPower} />
      </Controls>
      <Readouts items={[
        { label: '|Γ|', value: fmt(mag, 3) },
        { label: 'ROE', value: Number.isFinite(s) ? `${fmt(s, 3)} : 1` : '∞', tone: s < 1.5 ? 'good' : s < 3 ? 'warn' : 'bad' },
        { label: 'Pérdida de retorno', value: Number.isFinite(returnLossDb(mag)) ? `${fmt(returnLossDb(mag), 3)} dB` : '∞' },
        { label: 'Potencia reflejada', value: `${fmt(power * refl, 3)} W (${fmt(refl * 100, 3)} %)`, tone: refl > 0.1 ? 'bad' : undefined },
      ]} />
    </Instrument>
  );
}
