'use client';

import { useState } from 'react';
import { Instrument, Screen, Controls, Readouts, Chips, ScopeGrid } from '../ui/Instrument';
import { RangeField } from '../ui/RangeField';
import { useAnimationTime, toPath } from '../ui/useAnimationTime';
import { fmt } from '../ui/format';
import { sample, spectrum, type Mode } from './modulation';
import styles from '../radio.module.css';

const W = 600; const H = 200; const SH = 120;

const INFO: Record<Mode, { bw: string; text: string }> = {
  CW: { bw: '≈ 100–150 Hz', text: 'Telegrafía: la portadora se prende y se apaga con el Morse ("CQ"). El modo más angosto y el que más lejos llega con poca potencia.' },
  AM: { bw: '2 × audio (≈ 6 kHz)', text: 'La amplitud sigue a la voz. Hay portadora siempre, aunque no hables: gasta potencia en algo que no lleva información.' },
  FM: { bw: 'Carson: 2 × (desvío + audio)', text: 'Cambia la frecuencia, no la amplitud. El ruido de amplitud no la afecta. Ocupa más ancho: se usa en VHF/UHF (FM angosta, ±5 kHz).' },
  USB: { bw: '≈ 2,7 kHz', text: 'Banda lateral única: sin portadora y con un solo lado. Si no hablás, no sale nada. Mismo alcance que AM con mucho menos potencia: el estándar de voz en HF.' },
};

/** Osciloscopio + analizador de espectro para CW, AM, FM y SSB. */
export function ModulationScope() {
  const [mode, setMode] = useState<Mode>('AM');
  const [level, setLevel] = useState(0.8);
  const [beta, setBeta] = useState(1.5);
  const t = useAnimationTime();
  const rf: [number, number][] = []; const msg: [number, number][] = [];
  for (let x = 0; x <= W; x += 1.5) {
    const s = sample(mode, x / W, t, level, beta / 6);
    rf.push([x, H / 2 - s.rf * (H / 2 - 14)]);
    msg.push([x, 22 - s.msg * 12]);
  }
  const lines = spectrum(mode, level, beta);
  const sx = (o: number) => W / 2 + o * 32;
  return (
    <Instrument badge="MOD" title="Modulación: cómo viaja la información en la portadora" hint="Arriba: el audio (amarillo) y la señal de radio (celeste). Abajo: el espectro, o sea qué frecuencias ocupa.">
      <Chips label="Modo" value={mode} onChange={setMode} options={[
        { value: 'CW', label: 'CW' }, { value: 'AM', label: 'AM' }, { value: 'FM', label: 'FM' }, { value: 'USB', label: 'SSB (USB)' },
      ]} />
      <Screen>
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Señal ${mode} en el tiempo`}>
          <ScopeGrid w={W} h={H} />
          <path d={toPath(msg)} fill="none" stroke="var(--trace-2)" strokeWidth={1.5} opacity={0.9} />
          <path d={toPath(rf)} fill="none" stroke="var(--trace-1)" strokeWidth={1.4} />
        </svg>
      </Screen>
      <Screen>
        <svg viewBox={`0 0 ${W} ${SH}`} role="img" aria-label={`Espectro ${mode}`}>
          <line x1={10} x2={W - 10} y1={SH - 22} y2={SH - 22} stroke="var(--scope-axis)" />
          {lines.map((l) => (
            <line key={l.offset} x1={sx(l.offset)} x2={sx(l.offset)} y1={SH - 22} y2={SH - 22 - l.amp * (SH - 34)} stroke={l.offset === 0 ? 'var(--trace-1)' : 'var(--trace-3)'} strokeWidth={6} strokeLinecap="round" />
          ))}
          <text x={sx(0)} y={SH - 6} textAnchor="middle" className={styles.svgLabel}>portadora fc</text>
          <text x={sx(-4)} y={SH - 6} textAnchor="middle" className={styles.svgLabel}>LSB ←</text>
          <text x={sx(4)} y={SH - 6} textAnchor="middle" className={styles.svgLabel}>→ USB</text>
        </svg>
      </Screen>
      <Controls>
        {mode !== 'CW' ? <RangeField label={mode === 'AM' ? 'Índice de modulación m' : 'Nivel de audio'} value={level} min={0} max={1} step={0.01} display={fmt(level, 2)} onChange={setLevel} /> : null}
        {mode === 'FM' ? <RangeField label="Índice β (desvío / audio)" value={beta} min={0.2} max={5} step={0.1} display={fmt(beta, 2)} onChange={setBeta} /> : null}
      </Controls>
      <Readouts items={[
        { label: 'Ancho de banda', value: INFO[mode].bw, tone: 'good' },
        { label: 'Portadora presente', value: mode === 'USB' ? 'No' : mode === 'CW' ? 'Pulsada' : 'Sí' },
      ]} />
      <p className={styles.instrumentHint}>{INFO[mode].text}</p>
    </Instrument>
  );
}
