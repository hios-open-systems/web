'use client';

import { useState } from 'react';
import { BANDS, RANGE_COLORS, type Band } from '@/lib/radio/bands';
import { wavelength } from '@/lib/radio/physics';
import { Instrument, Screen, Readouts, Chips } from '../ui/Instrument';
import { si, meters } from '../ui/format';
import styles from '../radio.module.css';

const W = 640; const ROWS = 5; const H = 52 + ROWS * 26 + 24; const LMIN = Math.log10(0.1); const LMAX = Math.log10(2000);
const x = (mhz: number) => 20 + ((Math.log10(mhz) - LMIN) / (LMAX - LMIN)) * (W - 40);
type Filter = 'all' | 'novicio';
const ACCESS = { si: 'Sí', parcial: 'Parcial', no: 'No' } as const;

/** Mapa del espectro en escala logarítmica con las bandas de radioaficionado. */
export function BandChart() {
  const [picked, setPicked] = useState<Band>(BANDS[5]);
  const [filter, setFilter] = useState<Filter>('all');
  const visible = (b: Band) => filter === 'all' || b.novicio !== 'no';
  return (
    <Instrument badge="BANDAS" title="Mapa de bandas de radioaficionado" hint="Escala logarítmica de 100 kHz a 2 GHz. Tocá una banda. Límites: atribución UIT Región 2. Lo que puede usar cada categoría en Argentina está pendiente de verificar contra el Anexo A de ENACOM.">
      <Chips label="Filtro" value={filter} onChange={setFilter} options={[{ value: 'all', label: 'Todas' }, { value: 'novicio', label: 'Novicio (a verificar)' }]} />
      <Screen>
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Espectro con bandas de radioaficionado">
          {(['LF', 'MF', 'HF', 'VHF', 'UHF'] as const).map((r, i) => {
            const edges = [0.1, 0.3, 3, 30, 300, 2000];
            return (
              <g key={r}>
                <rect x={x(edges[i])} y={18} width={x(edges[i + 1]) - x(edges[i])} height={16} fill={RANGE_COLORS[r]} opacity={0.25} />
                <text x={(x(edges[i]) + x(edges[i + 1])) / 2} y={30} textAnchor="middle" className={styles.svgStrong}>{r}</text>
              </g>
            );
          })}
          {[0.1, 1, 10, 100, 1000].map((f) => (
            <g key={f}>
              <line x1={x(f)} x2={x(f)} y1={40} y2={H - 22} stroke="var(--scope-grid)" />
              <text x={x(f)} y={H - 8} textAnchor={f === 0.1 ? 'start' : 'middle'} className={styles.svgLabel}>{si(f * 1e6, 'Hz', 1)}</text>
            </g>
          ))}
          {BANDS.map((b, i) => {
            const bx = x(b.startMHz); const bw = Math.max(5, x(b.endMHz) - bx);
            const on = visible(b); const sel = b === picked;
            return (
              <g key={b.name} role="button" tabIndex={0} aria-label={b.name} style={{ cursor: 'pointer' }} opacity={on ? 1 : 0.15}
                onClick={() => setPicked(b)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setPicked(b); }}>
                <rect x={bx - 1} y={48 + (i % ROWS) * 26} width={bw + 2} height={18} rx={3} fill={RANGE_COLORS[b.range]} stroke={sel ? '#fff' : 'none'} strokeWidth={2} />
                <text x={bx + bw + 5} y={61 + (i % ROWS) * 26} className={sel ? styles.svgStrong : styles.svgLabel}>{b.name}</text>
              </g>
            );
          })}
        </svg>
      </Screen>
      <Readouts items={[
        { label: 'Banda', value: picked.name },
        { label: 'Rango (UIT R2)', value: `${si(picked.startMHz * 1e6, 'Hz', 5)} – ${si(picked.endMHz * 1e6, 'Hz', 5)}` },
        { label: 'λ al centro', value: meters(wavelength(((picked.startMHz + picked.endMHz) / 2) * 1e6)) },
        { label: 'Propagación', value: picked.propagation },
        { label: 'Usos típicos', value: picked.uses },
        { label: 'Novicio (AMSAT, a verificar)', value: `${ACCESS[picked.novicio]}${picked.note ? ` · ${picked.note}` : ''}`, tone: picked.novicio === 'si' ? 'good' : picked.novicio === 'parcial' ? 'warn' : 'bad' },
      ]} />
    </Instrument>
  );
}
