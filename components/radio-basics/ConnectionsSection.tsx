'use client';

import { useLocale, useTranslations } from 'next-intl';
import { MathLine } from '@/components/common/MathLine';
import { ConceptCircuit } from './ConceptCircuit';
import styles from './radioBasics.module.css';

function useWorkedExamples() {
  const locale = useLocale();
  const f = (value: number) => new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value);
  return {
    series: ['Rₑq = 100 + 200 = 300 Ω', `I = 12 / 300 = ${f(0.04)} A = 40 mA`, `V₁ = ${f(0.04)} × 100 = 4 V`, `V₂ = ${f(0.04)} × 200 = 8 V`],
    parallel: [
      `Rₑq = (100 × 200) / (100 + 200) ≈ ${f(200 / 3)} Ω`,
      'I₁ = 12 V / 100 Ω', `= ${f(0.12)} A = 120 mA`,
      'I₂ = 12 V / 200 Ω', `= ${f(0.06)} A = 60 mA`,
      'I = 120 + 60 = 180 mA',
    ],
  };
}

function ConnectionExplanation({ mode }: { mode: 'series' | 'parallel' }) {
  const t = useTranslations('RadioBasics.connections');
  const examples = useWorkedExamples();
  return (
    <section className={styles.connection}>
      <h3>{t(`${mode}Title`)}</h3>
      <p>{t(`${mode}Body`)}</p>
      <div className={styles.formula}>
        <MathLine>{mode === 'series' ? 'I = I₁ = I₂' : 'V = V₁ = V₂'}</MathLine>
        <MathLine>{mode === 'series' ? 'V = V₁ + V₂' : 'I = I₁ + I₂'}</MathLine>
      </div>
      <p>{t(`${mode}Derivation`)}</p>
      <div className={styles.calculation}>
        {examples[mode].map((line) => <MathLine key={line}>{line}</MathLine>)}
      </div>
      <p className={styles.takeaway}>{t(`${mode}Check`)}</p>
    </section>
  );
}

export function ConnectionLesson({ mode }: { mode: 'series' | 'parallel' }) {
  const t = useTranslations('RadioBasics.connections');
  return (
    <section id={mode} aria-label={t(`${mode}Title`)}>
      <p>{t('intro')}</p>
      <p>{t('equivalent')}</p>
      <p className={styles.exampleLabel}>{t('exampleLabel')}</p>
      <ConceptCircuit mode={mode} />
      <ConnectionExplanation mode={mode} />
      <p className={styles.takeaway}>{t('remember')}</p>
      <p>{t('open')}</p>
    </section>
  );
}
