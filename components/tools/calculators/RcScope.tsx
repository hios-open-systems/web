'use client';

import { useId } from 'react';
import { Button, InputNumber } from 'antd';
import { useTranslations } from 'next-intl';
import { TimeScope } from '@/components/instruments/TimeScope';
import { SCOPE_COLORS } from '@/components/instruments/channels';
import { rcSineModel, rcSineSamples } from '@/lib/instruments/rc';
import type { CalculatorState } from './useCalculatorState';
import styles from '@/components/instruments/instrumentScreen.module.css';

function ExcitationControls({ c }: { c: CalculatorState }) {
  const t = useTranslations('Instrument.rc');
  const id = useId();
  return <div className={styles.fields}>
    <div className={styles.field}><label htmlFor={`${id}-frequency`}>{t('frequency')}</label>
      <InputNumber id={`${id}-frequency`} value={Number(c.get('rcInputHz'))} min={0.1} max={1e6}
        onChange={(value) => c.set('rcInputHz', Number(value ?? 0))} style={{ width: '100%' }} />
    </div>
    <div className={styles.field}><label htmlFor={`${id}-amplitude`}>{t('amplitude')}</label>
      <InputNumber id={`${id}-amplitude`} value={Number(c.get('rcInputV'))} min={0.01} max={100} step={0.1}
        onChange={(value) => c.set('rcInputV', Number(value ?? 0))} style={{ width: '100%' }} />
    </div>
    <Button disabled={!c.cutoffValid || !Number.isFinite(c.cutoff)}
      onClick={() => c.set('rcInputHz', Number(c.cutoff.toPrecision(6)))}>{t('atCutoff')}</Button>
  </div>;
}

export function RcScope({ c }: { c: CalculatorState }) {
  const t = useTranslations('Instrument');
  const model = rcSineModel(c.rcR, c.rcC, Number(c.get('rcInputHz')), Number(c.get('rcInputV')));
  return <div className={styles.lab} data-rc-lab>
    <ExcitationControls c={c} />
    {model ? <>
      <div className={styles.readouts} data-rc-readouts>
        <span>|H| = {model.gain.toFixed(3)} ({(20 * Math.log10(model.gain)).toFixed(2)} dB)</span>
        <span>φ = {(model.phase * 180 / Math.PI).toFixed(1)}°</span>
        <span>Vout = {(model.peakVolts * model.gain).toFixed(3)} V {t('peak')}</span>
      </div>
      <TimeScope label={t('rc.title')} description={t('rc.description')}
        xAxis={{ domain: [0, model.duration], label: 't (s)' }}
        yAxis={{ domain: [-model.peakVolts * 1.2, model.peakVolts * 1.2], label: 'V' }}
        sample={(seconds) => {
          const values = rcSineSamples(model, seconds * Math.PI / 2);
          return [
            { id: 'vin', label: 'CH1 · Vin', color: SCOPE_COLORS[0], points: values.input },
            { id: 'vout', label: 'CH2 · Vout', color: SCOPE_COLORS[1], points: values.output },
          ];
        }} />
    </> : <p role="status">{t('invalid')}</p>}
    <p className={styles.hint}>{t('rc.hint')} {t('animationHint')}</p>
  </div>;
}
