'use client';

import { useState } from 'react';
import { COAX_CABLES, cableLossDb, powerAfterLoss } from '@/lib/radio/coax';
import { Instrument, Screen, Controls, Readouts, Chips } from '../ui/Instrument';
import { RangeField } from '../ui/RangeField';
import { si, fmt } from '../ui/format';
import styles from '../radio.module.css';

const W = 600; const ROW = 46;

/** Pérdida del coaxil: cuánta potencia llega de verdad a la antena. */
export function CoaxLab() {
  const [f, setF] = useState(146e6);
  const [len, setLen] = useState(20);
  const [power, setPower] = useState(5);
  const [sel, setSel] = useState('rg58');
  const cable = COAX_CABLES.find((c) => c.id === sel) ?? COAX_CABLES[0];
  const loss = cableLossDb(cable, f / 1e6, len);
  const out = powerAfterLoss(power, loss);
  const H = COAX_CABLES.length * ROW + 24;
  return (
    <Instrument badge="COAX" title="Pérdida en el cable coaxil" hint="Cada 3 dB perdés la mitad de la potencia. En VHF/UHF el cable fino se come la señal, de ida y de vuelta. Valores típicos: revisá la hoja de datos de tu cable.">
      <Chips label="Cable" value={sel} onChange={setSel} options={COAX_CABLES.map((c) => ({ value: c.id, label: `${c.name} (${fmt(c.diameterMm, 3)} mm)` }))} />
      <Screen>
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Potencia que llega a la antena por cable">
          {COAX_CABLES.map((c, i) => {
            const l = cableLossDb(c, f / 1e6, len);
            const frac = powerAfterLoss(1, l);
            const y = 14 + i * ROW;
            return (
              <g key={c.id} opacity={c.id === sel ? 1 : 0.55}>
                <text x={10} y={y + 20} className={styles.svgStrong}>{c.name}</text>
                <rect x={110} y={y + 6} width={W - 130} height={22} rx={5} fill="#1f2937" />
                <rect x={110} y={y + 6} width={(W - 130) * frac} height={22} rx={5} fill={frac > 0.7 ? '#4ade80' : frac > 0.4 ? '#facc15' : '#f87171'} />
                <text x={W - 26} y={y + 22} textAnchor="end" className={styles.svgStrong} fill="#0b1016">{fmt(frac * 100, 3)} % · −{fmt(l, 3)} dB</text>
              </g>
            );
          })}
        </svg>
      </Screen>
      <Controls>
        <RangeField label="Frecuencia" value={f} min={1.8e6} max={1.3e9} log display={si(f, 'Hz')} onChange={setF} />
        <RangeField label="Largo del cable" value={len} min={1} max={100} step={1} display={`${fmt(len)} m`} onChange={setLen} />
        <RangeField label="Potencia del equipo" value={power} min={0.5} max={200} log display={si(power, 'W')} onChange={setPower} />
      </Controls>
      <Readouts items={[
        { label: 'Pérdida total', value: `${fmt(loss, 3)} dB`, tone: loss > 3 ? 'bad' : loss > 1.5 ? 'warn' : 'good' },
        { label: 'Llega a la antena', value: si(out, 'W'), tone: 'good' },
        { label: 'Se pierde en calor', value: si(power - out, 'W') },
        { label: 'Factor de velocidad', value: fmt(cable.velocityFactor, 2) },
      ]} />
    </Instrument>
  );
}
