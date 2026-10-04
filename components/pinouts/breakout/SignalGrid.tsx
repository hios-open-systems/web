import { ROLE_LABEL, roleVar } from '@/config/pinouts/modules';
import type { BreakoutPin } from '@/config/pinouts/modules';
import styles from './breakout.module.css';

export function SignalGrid({ pins, labels }: { pins: BreakoutPin[]; labels?: Record<string, string> }) {
  return (
    <ul className={styles.signalGrid}>
      {pins.map((pin) => <li key={pin.name} data-signal-name={pin.name}>
        <span className={styles.funcDot} style={{ background: roleVar(pin.role) }} />
        <strong>{pin.name}</strong>
        <span className={styles.signalRole} style={{ color: roleVar(pin.role) }}>{labels?.[pin.name] ?? ROLE_LABEL[pin.role]}</span>
      </li>)}
    </ul>
  );
}
