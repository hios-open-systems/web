'use client';

import { useTranslations } from 'next-intl';
import { CircuitLab } from './CircuitLab';
import styles from './radioBasics.module.css';

export function LaboratorySection() {
  const t = useTranslations('RadioBasics');
  return (
    <section id="laboratory" aria-label={t('experiments.title')}>
      <p>{t('experiments.intro')}</p>
      <CircuitLab />
      <h2>{t('experiments.title')}</h2>
      <ol className={styles.experiments}>
        {(['one', 'two', 'three'] as const).map((key) => <li key={key}>{t(`experiments.${key}`)}</li>)}
      </ol>
    </section>
  );
}
