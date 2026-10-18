import React from 'react';
import { useTranslations } from 'next-intl';
import { CHANNELS } from './qpskMath';
import styles from './qpskSimulator.module.css';

export function QpskLegend() {
  const t = useTranslations('Qpsk');
  return (
    <footer className={styles.legendFooter}>
      <div className={styles.chTagsGroup}>
        {CHANNELS.map((channel) => (
          <span key={channel.id} className={styles.chTag} style={{ color: channel.color }}>
            {channel.label} · {t('colors.' + channel.colorName)}{channel.bit ? ' · ' + channel.bit : ''}
          </span>
        ))}
      </div>
      <p>{t('phaseExplanation')}</p>
      <p>{t('trajectoryExplanation')}</p>
      <p>{t('noiseExplanation')}</p>
      <p>{t('modelLimits')}</p>
    </footer>
  );
}
