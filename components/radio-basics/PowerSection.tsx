'use client';

import { Alert } from 'antd';
import { useTranslations } from 'next-intl';
import { MeterDiagram } from './MeterDiagram';
import styles from './radioBasics.module.css';

function MeasurementGuide() {
  const t = useTranslations('RadioBasics.power');
  return (
    <div className={styles.measurements}>
      <h3>{t('measurementTitle')}</h3>
      <div className={styles.connections}>
        <figure className={styles.measurement}>
          <h4>{t('voltmeterTitle')}</h4>
          <MeterDiagram kind="voltage" />
          <figcaption>{t('voltmeter')}</figcaption>
        </figure>
        <figure className={styles.measurement}>
          <h4>{t('ammeterTitle')}</h4>
          <MeterDiagram kind="current" />
          <figcaption>{t('ammeter')}</figcaption>
        </figure>
      </div>
      <p>{t('ohmmeter')}</p>
      <Alert type="warning" showIcon message={t('meterWarning')} />
    </div>
  );
}

export function PowerSection() {
  const t = useTranslations('RadioBasics.power');
  return (
    <section id="power" className={styles.section} aria-labelledby="power-title">
      <h2 id="power-title">{t('title')}</h2>
      <p>{t('intro')}</p>
      <div className={styles.formula}>P = V · I = I² · R = V² / R</div>
      <div className={styles.worked}>
        <h3>{t('workedTitle')}</h3>
        <p>{t('workedBody')}</p>
        <p>{t('rating')}</p>
      </div>
      <p>{t('conservation')}</p>
      <MeasurementGuide />
      <p className={styles.takeaway}>{t('rf')}</p>
    </section>
  );
}
