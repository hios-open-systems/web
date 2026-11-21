'use client';

import { useTranslations } from 'next-intl';
import { MathLine } from '@/components/common/MathLine';
import { OhmGraph } from './OhmGraph';
import styles from './radioBasics.module.css';

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

export function OhmSection({ showTitle = true }: { showTitle?: boolean }) {
  const t = useTranslations('RadioBasics.ohm');
  return (
    <section id="ohm" aria-label={t('title')}>
      {showTitle ? <h2>{t('title')}</h2> : null}
      <p>{t('intro')}</p>
      <div className={styles.formulas}>
        {([
          ['currentLabel', 'I = V / R'],
          ['voltageLabel', 'V = I · R'],
          ['resistanceLabel', 'R = V / I'],
        ] as const).map(([label, formula]) => (
          <div key={label}><span>{t(label)}</span><strong><MathLine>{formula}</MathLine></strong></div>
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
