'use client';

import { useState } from 'react';
import { resonatorResponse, bandwidth, resonanceHalfPowerEdges } from '@/lib/radio/physics';
import { Instrument, Screen, Controls, Readouts, Chips } from '../ui/Instrument';
import { RangeField } from '../ui/RangeField';
import { toPath } from '../ui/useAnimationTime';
import { si, fmt } from '../ui/format';
import styles from '../radio.module.css';

const W = 600; const H = 240;
type Kind = 'parallel' | 'series';

/** Circuito tanque: curva de selectividad, Q y ancho de banda a -3 dB. */
export function ResonanceLab() {
  const [f0, setF0] = useState(7.1e6);
  const [q, setQ] = useState(50);
  const [kind, setKind] = useState<Kind>('parallel');
  const span = 0.3; // ±30 % alrededor de f0
  const fAt = (x: number) => f0 * (1 - span + (2 * span * x) / W);
  const xAt = (f: number) => ((f / f0 - (1 - span)) / (2 * span)) * W;
  const pts: [number, number][] = [];
  for (let x = 0; x <= W; x += 2) pts.push([x, H - 20 - resonatorResponse(fAt(x), f0, q) * (H - 50)]);
  const bw = bandwidth(f0, q);
  const edges = resonanceHalfPowerEdges(f0, q);
  const y3 = H - 20 - Math.SQRT1_2 * (H - 50);
  return (
    <Instrument badge="LC · Q" title="Resonancia y selectividad" hint={kind === 'parallel'
      ? 'Tanque paralelo: en f₀ la impedancia es máxima. Se usa para elegir una frecuencia y rechazar las demás.'
      : 'LC serie: en f₀ la impedancia es mínima y deja pasar esa frecuencia. Misma curva de selectividad.'}>
      <Chips label="Tipo de circuito" value={kind} onChange={setKind} options={[{ value: 'parallel', label: 'Tanque paralelo' }, { value: 'series', label: 'LC serie' }]} />
      <Screen>
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Curva de resonancia, ancho de banda ${si(bw, 'Hz')}`}>
          <rect x={xAt(edges.low)} y={10} width={Math.max(1, xAt(edges.high) - xAt(edges.low))} height={H - 30} fill="rgba(34,211,238,0.12)" />
          <line x1={0} x2={W} y1={y3} y2={y3} stroke="var(--trace-4)" strokeDasharray="5 5" />
          <text x={8} y={y3 - 6} className={styles.svgLabel} fill="var(--trace-4)">-3 dB</text>
          <path d={toPath(pts)} fill="none" stroke="var(--trace-1)" strokeWidth={2.5} />
          <line x1={W / 2} x2={W / 2} y1={10} y2={H - 20} stroke="var(--trace-2)" strokeDasharray="3 5" />
          <text x={W / 2} y={H - 4} textAnchor="middle" className={styles.svgStrong} fill="var(--trace-2)">f₀ {si(f0, 'Hz')}</text>
          <text x={6} y={H - 4} className={styles.svgLabel}>{si(fAt(0), 'Hz')}</text>
          <text x={W - 6} y={H - 4} textAnchor="end" className={styles.svgLabel}>{si(fAt(W), 'Hz')}</text>
        </svg>
      </Screen>
      <Controls>
        <RangeField label="Frecuencia f₀" value={f0} min={1.8e6} max={450e6} log display={si(f0, 'Hz')} onChange={setF0} />
        <RangeField label="Factor de calidad Q" value={q} min={2} max={300} log display={fmt(q, 3)} onChange={setQ} />
      </Controls>
      <Readouts items={[
        { label: 'Ancho de banda = f₀/Q', value: si(bw, 'Hz'), tone: 'good' },
        { label: 'Corte inferior', value: si(edges.low, 'Hz') },
        { label: 'Corte superior', value: si(edges.high, 'Hz') },
        { label: 'Impedancia en f₀', value: kind === 'parallel' ? 'Máxima' : 'Mínima' },
      ]} />
    </Instrument>
  );
}
