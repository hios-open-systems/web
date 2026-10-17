import React from 'react';
import styles from './qpskSimulator.module.css';

interface QpskHeaderProps {
  running: boolean;
}

export function QpskHeader({ running }: QpskHeaderProps) {
  return (
    <header className={styles.instrumentHeader}>
      <div className={styles.brand}>
        <span className={styles.brandBadge}>DSO-QPSK</span>
        <h2 className={styles.brandTitle}>
          ANALIZADOR DE MODULACIÓN EN CUADRATURA &amp; CONSTELACIÓN ÓPTICA/RF
        </h2>
      </div>
      <div className={styles.statusIndicators}>
        <div className={styles.indicator}>
          <div
            className={`${styles.led} ${!running ? styles.ledPaused : ''}`}
            aria-hidden="true"
          />
          <span>{running ? "TRIG'D" : 'HOLD'}</span>
        </div>
        <div>
          MODO: <strong>COHERENTE I/Q</strong>
        </div>
      </div>
    </header>
  );
}
