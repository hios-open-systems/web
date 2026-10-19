'use client';

import { useId, useState } from 'react';
import { Select } from 'antd';
import { useTranslations } from 'next-intl';
import type { Breakout } from '@/config/pinouts/modules';
import { I2sScope } from '@/components/instruments/I2sScope';
import { formatScopeValue } from '@/components/instruments/plotGeometry';
import { i2sClockModel, I2S_SLOT_BITS } from '@/lib/instruments/i2s';
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
        options={I2S_SLOT_BITS.map((value) => ({ value, label: String(value) }))} />
    </div>
  </div>;
}

function I2sLab({ clockPin, wordPin }: { clockPin: string; wordPin: string }) {
  const [sampleRate, setSampleRate] = useState(48000);
  const [slotBits, setSlotBits] = useState(32);
  const model = i2sClockModel(sampleRate, slotBits);
  return <div className={styles.lab} data-pinout-signal-lab>
    <I2sControls {...{ sampleRate, slotBits, setSampleRate, setSlotBits }} />
    <I2sScope model={model} clockPin={clockPin} wordPin={wordPin} />
  </div>;
}

export function PinoutSignalLab({ breakout }: { breakout: Breakout }) {
  if (!breakout.signalLab) return null;
  return <I2sLab key={breakout.id} clockPin={breakout.signalLab.clockPin} wordPin={breakout.signalLab.wordPin} />;
}
