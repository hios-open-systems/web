'use client';
import { Typography } from 'antd';
import styles from '../audioTools.module.css';

const { Text } = Typography;
const clampCents = (c: number) => Math.max(-50, Math.min(50, c));

interface Props {
  near: { label: string; cents: number; index: number } | null;
  detected: { frequency: number; clarity: number } | null;
  active: boolean;
  inTune: boolean;
  status: string;
  listeningText: string;
  micPromptText: string;
}

export function TunerGaugeView({
  near,
  detected,
  active,
  inTune,
  status,
  listeningText,
  micPromptText,
}: Props) {
  const hasNear = near != null;
  const cents = near?.cents ?? 0;
  return (
    <div className={styles.readout}>
      <span
        className={styles.note}
        style={{ color: inTune ? '#22c55e' : undefined, opacity: hasNear ? 1 : 0.25 }}
      >
        {near ? near.label : '—'}
      </span>
      <span className={styles.frequency}>
        {hasNear && detected
          ? `${detected.frequency.toFixed(1)} Hz`
          : active
            ? listeningText
            : micPromptText}
      </span>
      <div className={styles.needleTrack} aria-hidden>
        <span className={styles.needle} style={{ left: `${50 + clampCents(cents)}%` }} />
      </div>
      <Text strong style={{ color: inTune ? '#22c55e' : undefined, minHeight: 24 }}>
        {status}
      </Text>
    </div>
  );
}
