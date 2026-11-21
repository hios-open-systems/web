'use client';

import { useTranslations } from 'next-intl';
import { MathLine } from '@/components/common/MathLine';
import { ConceptCircuit } from './ConceptCircuit';
import styles from './radioBasics.module.css';

export type ElectricalConcept = 'voltage' | 'current' | 'resistance' | 'power';

export function ConceptLesson({ concept }: { concept: ElectricalConcept }) {
  const t = useTranslations('RadioBasics.concepts');
  return (
    <section data-concept={concept} aria-label={t(`${concept}.title`)}>
      <p className={styles.eyebrow}>{t(`${concept}.unit`)}</p>
      {concept === 'voltage' ? <p>{t('intro')}</p> : null}
      <p>{t(`${concept}.definition`)}</p>
      <MathLine className={styles.formula}>{t(`${concept}.formula`)}</MathLine>
      <ConceptCircuit />
      <p>{t(`${concept}.example`)}</p>
      <p className={styles.takeaway}>{t(`${concept}.caution`)}</p>
    </section>
  );
}
