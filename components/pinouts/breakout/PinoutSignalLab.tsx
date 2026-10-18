'use client';

import { useId, useState } from 'react';
import { Select } from 'antd';
import { useTranslations } from 'next-intl';
import type { Breakout } from '@/config/pinouts/modules';
import { SCOPE_COLORS } from '@/components/instruments/channels';
import { TimeScope } from '@/components/instruments/TimeScope';
import { formatScopeValue } from '@/components/instruments/plotGeometry';
import { i2sClockModel, i2sClockSamples } from '@/lib/instruments/i2s';
import styles from '@/components/instruments/instrumentScreen.module.css';

function I2sControls({ sampleRate, slotBits, setSampleRate, setSlotBits }: {
  sampleRate: number; slotBits: number; setSampleRate: (value: number) => void; setSlotBits: (value: number) => void;
}) {
  const t = useTranslations('Instrument.i2s');
  const id = useId();
  return <div className={styles.fields}>
    <div className={styles.field}><label htmlFor={`${id}-fs`}>{t('sampleRate')}</label>
      <Select id={`${id}-fs`} value={sampleRate} onChange={setSampleRate}
        options={[44100, 48000, 96000].map((value) => ({ value, label: `${formatScopeValue(value)}Hz` }))} />
    </div>
    <div className={styles.field}><label htmlFor={`${id}-bits`}>{t('slotBits')}</label>
      <Select id={`${id}-bits`} value={slotBits} onChange={setSlotBits}
        options={[16, 32].map((value) => ({ value, label: String(value) }))} />
    </div>
  </div>;
}

function I2sLab({ clockPin, wordPin }: { clockPin: string; wordPin: string }) {
  const t = useTranslations('Instrument');
  const [sampleRate, setSampleRate] = useState(48000);
  const [slotBits, setSlotBits] = useState(32);
  const model = i2sClockModel(sampleRate, slotBits)!;
  return <div className={styles.lab} data-pinout-signal-lab>
    <I2sControls {...{ sampleRate, slotBits, setSampleRate, setSlotBits }} />
    <div className={styles.readouts} data-i2s-readouts>
      <span>{clockPin} = {formatScopeValue(model.bclk, 6)}Hz</span>
      <span>{wordPin} = {formatScopeValue(sampleRate)}Hz</span>
      <span>BCLK / fs = {2 * slotBits}</span>
    </div>
    <TimeScope label={t('i2s.title')} description={t('i2s.description')}
      xAxis={{ domain: [0, model.duration], label: 't (s)' }}
      yAxis={{ domain: [-0.4, 3.4], label: t('i2s.logic'), ticks: [0, 1, 2, 3], format: (v) => String(v % 2) }}
      sample={(seconds) => {
        const values = i2sClockSamples(model, seconds);
        return [
          { id: 'bclk', label: `CH1 · ${clockPin} (BCLK)`, color: SCOPE_COLORS[0], lineWidth: 1, points: values.bclk },
          { id: 'ws', label: `CH2 · ${wordPin} (WS)`, color: SCOPE_COLORS[1], lineWidth: 1, points: values.ws },
        ];
      }} />
    <p className={styles.hint}>{t('i2s.hint')} {t('animationHint')}</p>
    <p className={styles.hint}>{t('i2s.dataHint')} <a href="https://www.nxp.com/docs/en/user-manual/UM11732.pdf"
      target="_blank" rel="noopener noreferrer">{t('i2s.reference')}</a></p>
  </div>;
}

export function PinoutSignalLab({ breakout }: { breakout: Breakout }) {
  if (!breakout.signalLab) return null;
  return <I2sLab key={breakout.id} clockPin={breakout.signalLab.clockPin} wordPin={breakout.signalLab.wordPin} />;
}
