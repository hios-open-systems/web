'use client';

import { useTranslations } from 'next-intl';
import { OhmGraph } from './OhmGraph';
import styles from './radioBasics.module.css';

const concepts = ['voltage', 'current', 'resistance', 'power'] as const;

export function ConceptsSection() {
  const t = useTranslations('RadioBasics.concepts');
  return (
    <section id="concepts" className={styles.section} aria-labelledby="concepts-title">
      <h2 id="concepts-title">{t('title')}</h2>
      <p>{t('intro')}</p>
      <div className={styles.concepts}>
        {concepts.map((concept) => (
          <section key={concept} className={styles.concept} data-concept={concept}>
            <span className={styles.unit}>{t(`${concept}.unit`)}</span>
            <h3>{t(`${concept}.title`)}</h3>
            <p>{t(`${concept}.definition`)}</p>
            <div className={styles.formula}>{t(`${concept}.formula`)}</div>
            <p>{t(`${concept}.example`)}</p>
            <p className={styles.takeaway}>{t(`${concept}.caution`)}</p>
          </section>
        ))}
      </div>
    </section>
  );
}

function OhmWorkedExample() {
  const t = useTranslations('RadioBasics.ohm');
  return (
    <div className={styles.worked}>
      <h3>{t('workedTitle')}</h3>
      <ol>
        <li>{t('stepOne')}</li>
        <li>{t('stepTwo')}</li>
        <li>{t('stepThree')}</li>
      </ol>
      <p className={styles.takeaway}>{t('units')}</p>
    </div>
  );
}

export function OhmSection() {
  const t = useTranslations('RadioBasics.ohm');
  return (
    <section id="ohm" className={styles.section} aria-labelledby="ohm-title">
      <h2 id="ohm-title">{t('title')}</h2>
      <p>{t('intro')}</p>
      <div className={styles.formulas}>
        {([
          ['currentLabel', 'I = V / R'],
          ['voltageLabel', 'V = I · R'],
          ['resistanceLabel', 'R = V / I'],
        ] as const).map(([label, formula]) => (
          <div key={label}><span>{t(label)}</span><strong>{formula}</strong></div>
        ))}
      </div>
      <OhmWorkedExample />
      <p>{t('prediction')}</p>
      <figure className={styles.graph}>
        <h3>{t('graphTitle')}</h3>
        <OhmGraph />
        <figcaption>{t('graphText')}</figcaption>
      </figure>
    </section>
  );
}
