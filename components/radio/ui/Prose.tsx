import type { ReactNode } from 'react';
import styles from '../radio.module.css';

export function Section({ id, kicker, title, children }: { id: string; kicker: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className={styles.section} aria-labelledby={`${id}-h`}>
      <span className={styles.kicker}>{kicker}</span>
      <h2 id={`${id}-h`}>{title}</h2>
      {children}
    </section>
  );
}

export function Prose({ children }: { children: ReactNode }) {
  return <div className={styles.prose}>{children}</div>;
}

export function Formula({ children }: { children: ReactNode }) {
  return <code className={styles.formula}>{children}</code>;
}

export function Callout({ children, tone = 'warn' }: { children: ReactNode; tone?: 'warn' | 'info' }) {
  return <aside className={styles.callout} data-tone={tone}>{children}</aside>;
}
