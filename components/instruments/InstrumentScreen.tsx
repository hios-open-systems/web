import type { ReactNode } from 'react';
import type { ScopeChannel } from './channels';
import styles from './instrumentScreen.module.css';

export function InstrumentScreen({ label, channels = [], status, controls, children, className = '' }: {
  label: string;
  channels?: readonly ScopeChannel[];
  status?: ReactNode;
  controls?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`${styles.screen} ${className}`} role="group" aria-label={label}>
      <div className={styles.header}>
        <span className={styles.title}>{label}</span>
        <span className={styles.status}>{status}</span>
        {controls}
      </div>
      {channels.length > 0 && <div className={styles.legend}>
        {channels.map((channel) => <span key={channel.id} style={{ color: channel.color }}>
          <span className={styles.dot} aria-hidden="true" />{channel.label}
        </span>)}
      </div>}
      {children}
    </div>
  );
}
