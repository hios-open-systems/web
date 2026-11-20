'use client';

import { useState } from 'react';
import { Button } from 'antd';
import { useLocale, useTranslations } from 'next-intl';
import {
  formatFrequency, formatFrequencyRange, formatWavelengthRange, frequencyEdgesHz,
  radioBandSources, radioFrequencyBands, spectrumPosition, type FrequencyBand, type FrequencyBandId,
} from '@/lib/radio/bands';
import styles from './radioBands.module.css';
import { AmateurBands } from './AmateurBands';
import amateurStyles from './amateurBands.module.css';

function FrequencySpectrum({ selected, onSelect }: {
  selected: FrequencyBandId; onSelect: (band: FrequencyBandId) => void;
}) {
  const t = useTranslations('RadioBands');
  const locale = useLocale();
  return (
    <div className={styles.spectrum} role="group" aria-label={t('chartLabel')} data-testid="radio-band-spectrum">
      <div className={styles.axis} aria-hidden="true">
        {frequencyEdgesHz.map((frequency) => (
          <span key={frequency} className={styles.tick} style={{ top: `${spectrumPosition(frequency) * 100}%` }}>
            {formatFrequency(frequency, locale)}
          </span>
        ))}
      </div>
      <div className={styles.bandTrack}>
        {radioFrequencyBands.map((band) => (
          <Button key={band.id} type="text" className={styles.bandButton} data-band={band.id}
            aria-pressed={selected === band.id} onClick={() => onSelect(band.id)}
            style={{ top: `${spectrumPosition(band.minHz) * 100}%`, height: `${(spectrumPosition(band.maxHz) - spectrumPosition(band.minHz)) * 100}%` }}>
            <span className={styles.code}>{band.id.toUpperCase()}</span>
            <span className={styles.bandName}>{t(`bands.${band.id}.name`)}</span>
            <span className={styles.range}>{formatFrequencyRange(band, locale)}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}

function BandDetail({ band }: { band: FrequencyBand }) {
  const t = useTranslations('RadioBands');
  const locale = useLocale();
  return (
    <section className={styles.detail} aria-live="polite" aria-atomic="true" data-testid="radio-band-detail">
      <h2>{band.id.toUpperCase()} · {t(`bands.${band.id}.name`)}</h2>
      <p lang="en" className={styles.english}>{t(`bands.${band.id}.english`)}</p>
      <dl className={styles.metrics}>
        <div><dt>{t('range')}</dt><dd>{formatFrequencyRange(band, locale)}</dd></div>
        <div><dt>{t('wavelength')}</dt><dd>{formatWavelengthRange(band, locale)}</dd></div>
      </dl>
      <p>{t(`bands.${band.id}.description`)}</p>
    </section>
  );
}

function SpectrumGuide() {
  const t = useTranslations('RadioBands');
  const [selected, setSelected] = useState<FrequencyBandId>('hf');
  const band = radioFrequencyBands.find((candidate) => candidate.id === selected) ?? radioFrequencyBands[3];
  return (
    <section className={styles.bands} aria-label={t('title')}>
      <p className={styles.scaleNote}>{t('scale')}</p>
      <p className={styles.axisLabel}>{t('axisLabel')}</p>
      <FrequencySpectrum selected={selected} onSelect={setSelected} />
      <p className={styles.caption}>{t('selectionHint')}</p>
      <BandDetail band={band} />
      <p className={styles.note}>{t('wavelengthNote')}</p>
      <p className={styles.note}>{t('limits')}</p>
      <p className={styles.permission}>{t('permissionNote')}</p>
      <footer className={styles.sources}>
        <a href={radioBandSources.itu} target="_blank" rel="noreferrer">{t('ituSource')}</a>
        <a href={radioBandSources.enacom} target="_blank" rel="noreferrer">{t('enacomSource')}</a>
        <p>{t('sourcesNote')}</p>
      </footer>
    </section>
  );
}

export function RadioBands() {
  const t = useTranslations('RadioAmateurBands');
  return (
    <>
      <SpectrumGuide />
      <div className={amateurStyles.comparison}>
        <h2>{t('title')}</h2>
        <AmateurBands />
      </div>
    </>
  );
}
