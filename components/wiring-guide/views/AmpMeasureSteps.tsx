'use client';

import { useTranslations } from 'next-intl';
import { MAX_SD_EXAMPLE_VALUES } from '@/lib/electronics/max98357';
import styles from '../wiring-guide.module.css';

export function AmpMeasureSteps() {
  const t = useTranslations('Electronics.max');

  return (
    <section>
      <div className={styles.blockTitle}>{t('stepsTitle')}</div>
      <ol className={styles.stepList}>
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <li key={index}>
            {t(`steps.${index}`, MAX_SD_EXAMPLE_VALUES)}
          </li>
        ))}
      </ol>
    </section>
  );
}
