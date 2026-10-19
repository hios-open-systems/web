'use client';

import { useTranslations } from 'next-intl';
import { i2sClockSamples, type i2sClockModel } from '@/lib/instruments/i2s';
import { SCOPE_COLORS } from './channels';
import { TimeScope } from './TimeScope';
import { formatScopeValue } from './plotGeometry';
import styles from './instrumentScreen.module.css';

interface I2sScopeProps {
  model: ReturnType<typeof i2sClockModel>;
  clockPin?: string;
  wordPin?: string;
}

/** Shared ideal bus display; callers own their controls and saved configuration. */
export function I2sScope({ model, clockPin = 'BCLK', wordPin = 'WS' }: I2sScopeProps) {
  const t = useTranslations('Instrument');
  const channelLabel = (pin: string, signal: string) => pin === signal ? pin : `${pin} (${signal})`;
  return <div className={styles.lab} data-i2s-scope>
    {model ? <>
      <div className={styles.readouts} data-i2s-readouts>
        <span>{clockPin} = {formatScopeValue(model.bclk, 6)}Hz</span>
        <span>{wordPin} = {formatScopeValue(model.sampleRate, 6)}Hz</span>
        <span>BCLK / fs = {2 * model.slotBits}</span>
      </div>
      <TimeScope label={t('i2s.title')} description={t('i2s.description')}
        xAxis={{ domain: [0, model.duration], label: 't (s)' }}
        yAxis={{ domain: [-0.4, 3.4], label: t('i2s.logic'), ticks: [0, 1, 2, 3], format: (v) => String(v % 2) }}
        sample={(seconds) => {
          const values = i2sClockSamples(model, seconds);
          return [
            { id: 'bclk', label: `CH1 · ${channelLabel(clockPin, 'BCLK')}`, color: SCOPE_COLORS[0], lineWidth: 1, points: values.bclk },
            { id: 'ws', label: `CH2 · ${channelLabel(wordPin, 'WS')}`, color: SCOPE_COLORS[1], lineWidth: 1, points: values.ws },
          ];
        }} />
    </> : <p role="status">{t('i2s.invalid')}</p>}
    <p className={styles.hint}>{t('i2s.hint')} {t('animationHint')}</p>
    <p className={styles.hint}>{t('i2s.dataHint')} <a href="https://www.nxp.com/docs/en/user-manual/UM11732.pdf"
      target="_blank" rel="noopener noreferrer">{t('i2s.reference')}</a></p>
  </div>;
}
