import React from 'react';
import { useTranslations } from 'next-intl';
import styles from './qpskSimulator.module.css';

export function QpskHeader({ running }: { running: boolean }) {
  const t = useTranslations('Qpsk');
  return (
    <header className={styles.instrumentHeader}>
      <div className={styles.brand}>
        <span className={styles.brandBadge}>DSO-QPSK</span>
        <h2 className={styles.brandTitle}>{t('title')}</h2>
      </div>
      <div className={styles.statusIndicators}>
        <div className={styles.indicator}>
          <div className={[styles.led, !running && styles.ledPaused].filter(Boolean).join(' ')}
            aria-hidden="true" />
          <span>{t(running ? 'running' : 'paused')}</span>
        </div>
        <strong>{t('mode')}</strong>
      </div>
    </header>
  );
}
