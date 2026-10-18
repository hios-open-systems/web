import React from 'react';
import { Button } from 'antd';
import { useTranslations } from 'next-intl';
import type { Dibit } from './types';
import { force180Dibits, getNextDibit, getRandomDibits, mapDibit } from './qpskMath';
import styles from './qpskSimulator.module.css';

export function QpskSequence({ dibits, onChange }: {
  dibits: Dibit[]; onChange: (dibits: Dibit[]) => void;
}) {
  const t = useTranslations('Qpsk');
  return (
    <div className={styles.controlGroup}>
      <div className={styles.controlLabelRow}>
        <span>{t('sequence')}</span><span className={styles.labelValue}>{t('symbolCount', { count: dibits.length })}</span>
      </div>
      <div className={styles.bitInputWrapper}>
        {dibits.map((dibit, index) => {
          const { phaseDeg } = mapDibit(dibit);
          return (
            <Button key={index} className={styles.dibitBtn}
              onClick={() => onChange(dibits.map((d, i) => i === index ? getNextDibit(d) : d))}
              aria-label={t('symbolLabel', { index: index + 1, dibit, phase: phaseDeg })}>
              <span>{dibit}</span><span className={styles.dibitPhase}>{phaseDeg}°</span>
            </Button>
          );
        })}
      </div>
      <div className={styles.btnRow}>
        <Button className={styles.actionBtnSecondary} onClick={() => onChange(getRandomDibits(dibits.length))}>
          {t('random')}
        </Button>
        <Button className={styles.actionBtnSecondary} onClick={() => onChange(force180Dibits(dibits.length))}>
          {t('force180')}
        </Button>
      </div>
    </div>
  );
}
