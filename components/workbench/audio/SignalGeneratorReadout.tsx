'use client';

import { NOISES, SIGNAL_MODES, type ChannelTarget, type NoiseKind, type SignalMode } from './signalGeneratorCore';
import styles from './audioTools.module.css';

interface SignalGeneratorReadoutProps {
  mode: SignalMode;
  frequency: number;
  gain: number;
  waveform: OscillatorType;
  noise: NoiseKind;
  sweepStart: number;
  sweepEnd: number;
  sweepDuration: number;
  channel: ChannelTarget;
}

export function SignalGeneratorReadout(props: SignalGeneratorReadoutProps) {
  const label =
    props.mode === 'noise'
      ? NOISES.find((item) => item.value === props.noise)?.label
      : props.mode === 'sweep'
        ? `${props.sweepStart}-${props.sweepEnd}`
        : props.frequency.toFixed(0);
  const detail =
    props.mode === 'sweep'
      ? `Hz · ${props.sweepDuration}s`
      : props.mode === 'noise'
        ? 'ruido'
        : `Hz · ${props.mode === 'channel' ? props.channel : props.waveform}`;

  return (
    <div className={styles.readout}>
      <span className={styles.note}>{label}</span>
      <span className={styles.frequency}>{detail}</span>
      <div className={styles.statGrid}>
        <Stat label="Modo" value={SIGNAL_MODES.find((item) => item.value === props.mode)?.label ?? ''} />
        <Stat label="Nivel" value={`${Math.round(props.gain * 200)}%`} />
        <Stat label="Salida" value={props.mode === 'channel' ? props.channel : 'stereo'} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <span className={styles.stat}>
      <span className={styles.statLabel}>{label}</span>
      <span className={styles.statValue}>{value}</span>
    </span>
  );
}
