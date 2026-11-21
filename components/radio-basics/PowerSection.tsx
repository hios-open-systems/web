'use client';

import { Alert } from 'antd';
import { useTranslations } from 'next-intl';
import { MathLine } from '@/components/common/MathLine';
import { MeterDiagram } from './MeterDiagram';
import styles from './radioBasics.module.css';

export function MeasurementSection() {
  const t = useTranslations('RadioBasics.power');
  return (
    <section id="measurement" aria-label={t('measurementTitle')}>
      <div className={styles.connections}>
        <figure className={styles.measurement}>
          <h2>{t('voltmeterTitle')}</h2>
          <MeterDiagram kind="voltage" />
          <figcaption>{t('voltmeter')}</figcaption>
        </figure>
        <figure className={styles.measurement}>
          <h2>{t('ammeterTitle')}</h2>
          <MeterDiagram kind="current" />
          <figcaption>{t('ammeter')}</figcaption>
        </figure>
      </div>
      <p>{t('ohmmeter')}</p>
      <Alert type="warning" showIcon message={t('meterWarning')} />
    </section>
  );
}

export function PowerSection({ showTitle = true }: { showTitle?: boolean }) {
  const t = useTranslations('RadioBasics.power');
  return (
    <section id="power" aria-label={t('title')}>
      {showTitle ? <h2>{t('title')}</h2> : null}
      <p>{t('intro')}</p>
      <MathLine className={styles.formula}>P = V · I = I² · R = V² / R</MathLine>
      <div className={styles.worked}>
        <h3>{t('workedTitle')}</h3>
        <p>{t('workedBody')}</p>
        <p>{t('rating')}</p>
      </div>
      <p>{t('conservation')}</p>
      <p className={styles.takeaway}>{t('rf')}</p>
    </section>
  );
}
