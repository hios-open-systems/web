'use client';
import { Button, Slider } from 'antd';
import type { ChiptuneTrack, TrackTimbre } from '@/lib/workbench/chiptune';
import { RECIPES } from './synth';
import styles from './chiptune.module.css';
interface Props {
  onTimbre: (id: string, patch: TrackTimbre) => void;
  onResetTimbre: (id: string) => void;
}
export function TimbreEditor({
  track,
  onTimbre,
  onResetTimbre,
}: {
  track: ChiptuneTrack;
  onTimbre: Props['onTimbre'];
  onResetTimbre: Props['onResetTimbre'];
}) {
  const base = RECIPES[track.instrument];
  const t = track.timbre ?? {};
  const val = (k: keyof TrackTimbre, fallback: number): number => {
    const v = t[k] ?? (base as unknown as Record<string, number | undefined>)[k];
    return typeof v === 'number' ? v : fallback;
  };
  const row = (label: string, node: React.ReactNode) => (
    <div className={styles.timbreRow}>
      <span className={styles.timbreLabel}>{label}</span>
      <div className={styles.timbreControl}>{node}</div>
    </div>
  );
  const slider = (k: keyof TrackTimbre, min: number, max: number, step: number, fallback: number) => (
    <Slider
      min={min}
      max={max}
      step={step}
      value={val(k, fallback)}
      onChange={(v) => onTimbre(track.id, { [k]: v })}
    />
  );
  return (
    <div className={styles.timbrePanel} onClick={(e) => e.stopPropagation()}>
      {base.kind === 'pulse' && row('Pulso', slider('duty', 0.05, 0.95, 0.05, 0.5))}
      {row('Attack', slider('attack', 0, 0.5, 0.005, 0.01))}
      {row('Decay', slider('decay', 0, 1, 0.01, 0.05))}
      {row('Sustain', slider('sustain', 0, 1, 0.05, 0.7))}
      {row('Release', slider('release', 0, 1, 0.01, 0.08))}
      {row('Filtro', slider('filterHz', 200, 12000, 100, 4000))}
      {row('Detune', slider('detune', -50, 50, 1, 0))}
      {row('Nivel', slider('peak', 0.02, 0.5, 0.01, 0.2))}
      <Button size="small" block onClick={() => onResetTimbre(track.id)}>
        Reset timbre
      </Button>
    </div>
  );
}
