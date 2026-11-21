'use client';

import { useTranslations } from 'next-intl';
import styles from './radioBasics.module.css';

export function OhmGraph() {
  const t = useTranslations('RadioBasics.ohm');
  return (
    <div className={styles.graphPlot}>
      <p className={styles.axisLabel}>{t('currentAxis')}</p>
      <svg viewBox="0 0 360 230" role="img" aria-label={t('graphDescription')}>
        <title>{t('graphTitle')}</title>
        <desc>{t('graphDescription')}</desc>
        {[0, 30, 60, 90, 120].map((value) => (
          <g key={value}>
            <line x1="44" y1={190 - value * 1.25} x2="322" y2={190 - value * 1.25} className={styles.gridLine} />
            <text x="35" y={196 - value * 1.25} textAnchor="end">{value}</text>
          </g>
        ))}
        {[0, 3, 6, 9, 12].map((value) => (
          <g key={value}>
            <line x1={44 + value * 23} y1="40" x2={44 + value * 23} y2="190" className={styles.gridLine} />
            <text x={44 + value * 23} y="216" textAnchor="middle">{value}</text>
          </g>
        ))}
        <line x1="44" y1="190" x2="322" y2="190" className={styles.axis} />
        <line x1="44" y1="190" x2="44" y2="35" className={styles.axis} />
        <line x1="44" y1="190" x2="320" y2="40" className={styles.lineOne} />
        <line x1="44" y1="190" x2="320" y2="115" className={styles.lineTwo} />
        <circle cx="320" cy="40" r="5" className={styles.pointOne} />
        <rect x="315" y="110" width="10" height="10" className={styles.pointTwo} />
        <text x="206" y="37" className={styles.labelOne}>100 Ω</text>
        <text x="206" y="173" className={styles.labelTwo}>200 Ω</text>
      </svg>
      <p className={styles.axisLabel} style={{ textAlign: 'right' }}>{t('voltageAxis')}</p>
    </div>
  );
}
