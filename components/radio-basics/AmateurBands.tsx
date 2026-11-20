'use client';

import { useState } from 'react';
import { Button } from 'antd';
import { useLocale, useTranslations } from 'next-intl';
import { amateurBands, amateurBandSources, formatAmateurBandRange, type AmateurBand, type AmateurBandId } from '@/lib/radio/amateurBands';
import styles from './amateurBands.module.css';

function AmateurBandTable({ selected, onSelect }: {
  selected: AmateurBandId; onSelect: (id: AmateurBandId) => void;
}) {
  const t = useTranslations('RadioAmateurBands');
  const locale = useLocale();
  return (
    <table className={styles.table} data-testid="amateur-band-table" role="table">
      <caption className={styles.srOnly}>{t('title')}</caption>
      <thead><tr>{(['band', 'range', 'propagation', 'use'] as const).map((column) => <th key={column} scope="col">{t(`columns.${column}`)}</th>)}</tr></thead>
      <tbody>{amateurBands.map((band) => (
        <tr key={band.id} data-selected={selected === band.id} data-amateur-band={band.id}>
          <th scope="row" className={styles.bandCell}>
            <Button type="link" aria-pressed={selected === band.id} onClick={() => onSelect(band.id)}>{band.label}</Button>
            <span>{band.family}</span>
          </th>
          <td data-label={t('columns.range')} className={styles.range}>{formatAmateurBandRange(band, locale)}</td>
          <td data-label={t('columns.propagation')}>{t(`entries.${band.id}.propagation`)}</td>
          <td data-label={t('columns.use')}>{t(`entries.${band.id}.use`)}</td>
        </tr>
      ))}</tbody>
    </table>
  );
}

function AmateurBandDetail({ band }: { band: AmateurBand }) {
  const t = useTranslations('RadioAmateurBands');
  return (
    <section id="amateur-band-detail" className={styles.detail} aria-live="polite" aria-atomic="true" data-testid="amateur-band-detail">
      <p className={styles.eyebrow}>{t('detailTitle')}</p>
      <h2>{t(`entries.${band.id}.name`)}</h2>
      <dl>
        <div><dt>{t('antennas')}</dt><dd>{t(`entries.${band.id}.antennas`)}</dd></div>
        <div><dt>{t('modes')}</dt><dd>{t(`entries.${band.id}.modes`)}</dd></div>
        <div className={styles.detailNote}><dt>{t('notes')}</dt><dd>{t(`entries.${band.id}.notes`)}</dd></div>
      </dl>
      <p className={styles.conditions}>{t('antennaNote')}</p>
      {band.family !== 'HF' ? <p className={styles.conditions}>{t('buildingNote')}</p> : null}
    </section>
  );
}

function TechnologyExplanation() {
  const t = useTranslations('RadioAmateurBands');
  return (
    <section className={styles.technology}>
      <h2>{t('technologyTitle')}</h2>
      <dl>
        <div><dt>{t('modulationLabel')}</dt><dd>{t('modulation')}</dd></div>
        <div><dt>{t('protocolLabel')}</dt><dd>{t('protocol')}</dd></div>
        <div><dt>{t('cipherTitle')}</dt><dd>{t('cipherText')}</dd></div>
      </dl>
    </section>
  );
}

export function AmateurBands() {
  const t = useTranslations('RadioAmateurBands');
  const [selected, setSelected] = useState<AmateurBandId>('forty');
  const band = amateurBands.find((candidate) => candidate.id === selected) ?? amateurBands[1];
  const selectBand = (id: AmateurBandId) => {
    setSelected(id);
    document.getElementById('amateur-band-detail')?.scrollIntoView({ block: 'start' });
  };
  return (
    <section className={styles.amateur} aria-label={t('title')}>
      <p>{t('intro')}</p>
      <AmateurBandTable selected={selected} onSelect={selectBand} />
      <AmateurBandDetail band={band} />
      <TechnologyExplanation />
      <p className={styles.conditions}>{t('conditions')}</p>
      <p className={styles.permission}>{t('permission')}</p>
      <footer className={styles.sources}>
        <p>{t('referenceLabel')}</p>
        <p>{t('sourcesNote')}</p>
        <a href={amateurBandSources.bands} target="_blank" rel="noreferrer">{t('sourceLabel')}</a>
        <a href={amateurBandSources.regulation} target="_blank" rel="noreferrer">{t('regulationSource')}</a>
        <a href={amateurBandSources.propagation} target="_blank" rel="noreferrer">{t('propagationSource')}</a>
        <a href={amateurBandSources.indoor} target="_blank" rel="noreferrer">{t('indoorSource')}</a>
      </footer>
    </section>
  );
}
