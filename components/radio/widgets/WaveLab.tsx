'use client';

import { useState } from 'react';
import { wavelength, peakToRms } from '@/lib/radio/physics';
import { Instrument, Screen, Controls, Readouts, ScopeGrid } from '../ui/Instrument';
import { RangeField } from '../ui/RangeField';
import { useAnimationTime, toPath } from '../ui/useAnimationTime';
import { si, meters, fmt } from '../ui/format';
import styles from '../radio.module.css';

const W = 600; const H = 240;

function compare(lambda: number): string {
  if (lambda > 10000) return 'más que una ciudad';
  if (lambda > 300) return 'varias cuadras';
  if (lambda > 40) return 'una cancha de fútbol a lo ancho';
  if (lambda > 10) return 'un edificio de 4 pisos';
  if (lambda > 1.5) return 'una persona o una puerta';
  if (lambda > 0.3) return 'una regla larga';
  if (lambda > 0.05) return 'un celular';
  return 'una moneda';
}

/** Onda senoidal: frecuencia, período, λ y valores pico / pico a pico / RMS. */
export function WaveLab() {
  const [f, setF] = useState(7.1e6);
  const [vpk, setVpk] = useState(1);
  const t = useAnimationTime();
  const lambda = wavelength(f);
  const amp = (H / 2 - 16) * vpk;
  const pts: [number, number][] = [];
  for (let x = 0; x <= W; x += 3) pts.push([x, H / 2 - amp * Math.sin((x / W) * 4 * Math.PI - t * 3)]);
  const rmsY = H / 2 - amp / Math.SQRT2;
  const cycleW = W / 2;
  return (
    <Instrument badge="λ = c/f" title="Frecuencia, período y longitud de onda" hint="La pantalla muestra siempre 2 ciclos. Cambiá la frecuencia y mirá cuánto mide un ciclo en el espacio.">
      <Screen>
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Onda de ${si(f, 'Hz')} con λ de ${meters(lambda)}`}>
          <ScopeGrid w={W} h={H} />
          <line x1={0} x2={W} y1={rmsY} y2={rmsY} stroke="var(--trace-4)" strokeDasharray="6 6" />
          <text x={6} y={rmsY - 4} className={styles.svgLabel} fill="var(--trace-4)">RMS {fmt(peakToRms(vpk))} V</text>
          <line x1={W - 40} x2={W - 40} y1={H / 2 - amp} y2={H / 2 + amp} stroke="var(--trace-3)" strokeWidth={2} />
          <text x={W - 46} y={H / 2 - amp + 12} textAnchor="end" className={styles.svgLabel}>pp {fmt(2 * vpk)} V</text>
          <path d={toPath(pts)} fill="none" stroke="var(--trace-1)" strokeWidth={2.5} />
          <line x1={0} x2={cycleW} y1={H - 14} y2={H - 14} stroke="var(--trace-2)" strokeWidth={2} markerEnd="url(#arr)" markerStart="url(#arr)" />
          <text x={cycleW / 2} y={H - 20} textAnchor="middle" className={styles.svgStrong} fill="var(--trace-2)">λ = {meters(lambda)}</text>
          <defs><marker id="arr" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="var(--trace-2)" /></marker></defs>
        </svg>
      </Screen>
      <Controls>
        <RangeField label="Frecuencia" value={f} min={50} max={3e9} log display={si(f, 'Hz')} onChange={setF} />
        <RangeField label="Tensión pico" value={vpk} min={0.1} max={1} step={0.01} display={`${fmt(vpk)} V`} onChange={setVpk} />
      </Controls>
      <Readouts items={[
        { label: 'Frecuencia', value: si(f, 'Hz') },
        { label: 'Período T = 1/f', value: si(1 / f, 's') },
        { label: 'Longitud de onda', value: meters(lambda), tone: 'good' },
        { label: 'Tamaño de', value: compare(lambda) },
      ]} />
    </Instrument>
  );
}
