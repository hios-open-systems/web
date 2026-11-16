'use client';

import { useState } from 'react';
import { Instrument, Screen, Controls, Readouts, Chips } from '../ui/Instrument';
import { RangeField } from '../ui/RangeField';
import { fmt } from '../ui/format';
import styles from '../radio.module.css';

type Time = 'day' | 'night';
const W = 600; const H = 260; const GROUND = H - 26;
// Modelo didáctico: alturas en km y frecuencia crítica foF2 típica de ciclo medio.
const LAYERS: Record<Time, ReadonlyArray<{ name: string; lo: number; hi: number; color: string }>> = {
  day: [
    { name: 'D', lo: 60, hi: 90, color: 'rgba(248,113,113,0.25)' },
    { name: 'E', lo: 95, hi: 130, color: 'rgba(250,204,21,0.18)' },
    { name: 'F1', lo: 160, hi: 220, color: 'rgba(34,211,238,0.16)' },
    { name: 'F2', lo: 250, hi: 400, color: 'rgba(129,140,248,0.22)' },
  ],
  night: [
    { name: 'E (débil)', lo: 100, hi: 120, color: 'rgba(250,204,21,0.08)' },
    { name: 'F', lo: 260, hi: 420, color: 'rgba(129,140,248,0.2)' },
  ],
};
const FOF2: Record<Time, number> = { day: 9, night: 5 };
const yKm = (km: number) => GROUND - (km / 450) * (GROUND - 10);

/** Rebote ionosférico: capas de día y de noche, MUF y absorción de la capa D. */
export function IonosphereLab() {
  const [time, setTime] = useState<Time>('day');
  const [f, setF] = useState(7.1);
  const [angle, setAngle] = useState(25);
  const reflectKm = 300;
  const rad = (angle * Math.PI) / 180;
  const incidence = Math.PI / 2 - rad;
  const muf = FOF2[time] / Math.cos(incidence);
  const bounces = f <= muf;
  const absorbed = time === 'day' && f < 5;
  const dx = (reflectKm / Math.tan(rad)) * (W / 3000);
  const x0 = 40; const xTop = x0 + dx; const yTop = yKm(reflectKm);
  const skipKm = (2 * reflectKm) / Math.tan(rad);
  const rayColor = absorbed ? '#f87171' : bounces ? 'var(--trace-4)' : 'var(--trace-2)';
  return (
    <Instrument badge="IONO" title="Propagación ionosférica en HF" hint="Modelo simplificado. La ionosfera dobla las ondas de vuelta a tierra si la frecuencia es menor que la MUF para ese ángulo. De día la capa D absorbe las bandas bajas.">
      <Chips label="Momento del día" value={time} onChange={setTime} options={[{ value: 'day', label: '☀ Día' }, { value: 'night', label: '☾ Noche' }]} />
      <Screen>
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={bounces ? 'La onda vuelve a tierra' : 'La onda escapa al espacio'}>
          <rect width={W} height={H} fill={time === 'day' ? '#0b1a2b' : '#05070d'} />
          {LAYERS[time].map((l) => (
            <g key={l.name}>
              <rect x={0} y={yKm(l.hi)} width={W} height={yKm(l.lo) - yKm(l.hi)} fill={l.color} />
              <text x={W - 8} y={yKm(l.hi) + 14} textAnchor="end" className={styles.svgStrong}>{l.name} · {l.lo}–{l.hi} km</text>
            </g>
          ))}
          <path d={`M0,${GROUND} Q${W / 2},${GROUND - 14} ${W},${GROUND}`} fill="#14532d" stroke="#22c55e" />
          {absorbed ? (
            <path d={`M${x0},${GROUND} L${x0 + (dx * 75) / reflectKm},${yKm(75)}`} stroke={rayColor} strokeWidth={3} strokeDasharray="2 4" />
          ) : bounces ? (
            <path d={`M${x0},${GROUND} L${xTop},${yTop} L${x0 + 2 * dx},${GROUND}`} fill="none" stroke={rayColor} strokeWidth={3} />
          ) : (
            <path d={`M${x0},${GROUND} L${xTop},${yTop} L${xTop + dx * 0.6},${yKm(440)}`} fill="none" stroke={rayColor} strokeWidth={3} />
          )}
          <circle cx={x0} cy={GROUND} r={5} fill="#e2e8f0" />
          <text x={x0} y={H - 8} textAnchor="middle" className={styles.svgLabel}>TX</text>
          {bounces && !absorbed ? <text x={Math.min(W - 30, x0 + 2 * dx)} y={H - 8} textAnchor="middle" className={styles.svgLabel}>RX</text> : null}
        </svg>
      </Screen>
      <Controls>
        <RangeField label="Frecuencia" value={f} min={1.8} max={30} log display={`${fmt(f, 3)} MHz`} onChange={setF} />
        <RangeField label="Ángulo de salida" value={angle} min={5} max={85} step={1} display={`${angle}°`} onChange={setAngle} />
      </Controls>
      <Readouts items={[
        { label: 'MUF para este ángulo', value: `${fmt(muf, 3)} MHz` },
        { label: 'Resultado', value: absorbed ? 'Absorbida (capa D)' : bounces ? 'Vuelve a tierra' : 'Escapa al espacio', tone: absorbed || !bounces ? 'bad' : 'good' },
        { label: 'Distancia del salto', value: bounces && !absorbed ? `≈ ${fmt(skipKm, 2)} km` : '—' },
        { label: 'Ángulos altos', value: angle > 70 ? 'NVIS: cobertura regional' : 'DX: más lejos' },
      ]} />
    </Instrument>
  );
}
