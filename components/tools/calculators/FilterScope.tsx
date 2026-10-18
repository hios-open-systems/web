'use client';

import { useId } from 'react';
import { Button, InputNumber } from 'antd';
import { useTranslations } from 'next-intl';
import { TimeScope } from '@/components/instruments/TimeScope';
import { SCOPE_COLORS } from '@/components/instruments/channels';
import { sineSamples, type SineModel } from '@/lib/instruments/sine';
import styles from '@/components/instruments/instrumentScreen.module.css';

interface ValueControl { value: number; onChange: (value: number) => void; }
interface FilterScopeProps {
  kind: 'rc' | 'rl' | 'rcl';
  model: SineModel | null;
  frequency?: ValueControl;
  amplitude: ValueControl;
  characteristic: number;
  onCharacteristic: () => void;
}

function ExcitationControls({ kind, frequency, amplitude, characteristic, onCharacteristic }: FilterScopeProps) {
  const t = useTranslations('Instrument.excitation');
  const id = useId();
  return <div className={styles.fields}>
    {frequency && <div className={styles.field}><label htmlFor={`${id}-frequency`}>{t('frequency')}</label>
      <InputNumber id={`${id}-frequency`} value={frequency.value} min={0.1}
        onChange={(value) => frequency.onChange(Number(value ?? 0))} style={{ width: '100%' }} />
    </div>}
    <div className={styles.field}><label htmlFor={`${id}-amplitude`}>{t('amplitude')}</label>
      <InputNumber id={`${id}-amplitude`} value={amplitude.value} min={0.01} max={100} step={0.1}
        onChange={(value) => amplitude.onChange(Number(value ?? 0))} style={{ width: '100%' }} />
    </div>
    <Button disabled={!(characteristic > 0 && Number.isFinite(characteristic))}
      onClick={onCharacteristic}>{t(kind === 'rcl' ? 'atResonance' : 'atCutoff')}</Button>
  </div>;
}

export function FilterScope(props: FilterScopeProps) {
  const { kind, model } = props;
  const t = useTranslations('Instrument');
  // Rounding via Number avoids showing −0.0° at resonance.
  const phase = model ? Number((model.phase * 180 / Math.PI).toFixed(1)).toFixed(1) : '';
  return <div className={styles.lab} data-filter-lab={kind} data-rc-lab={kind === 'rc' || undefined}>
    <ExcitationControls {...props} />
    {model ? <>
      <div className={styles.readouts} data-filter-readouts data-rc-readouts={kind === 'rc' || undefined}>
        <span>|H| = {model.gain.toFixed(3)} ({Number((20 * Math.log10(model.gain)).toFixed(2)).toFixed(2)} dB)</span>
        <span>φ = {phase}°</span>
        <span>Vout = {(model.peakVolts * model.gain).toFixed(3)} V {t('peak')}</span>
      </div>
      <TimeScope label={t(`${kind}.title`)} description={t(`${kind}.description`)}
        xAxis={{ domain: [0, model.duration], label: 't (s)' }}
        yAxis={{ domain: [-model.peakVolts * 1.2, model.peakVolts * 1.2], label: 'V' }}
        sample={(seconds) => {
          const values = sineSamples(model, seconds * Math.PI / 2);
          return [
            { id: 'vin', label: 'CH1 · Vin', color: SCOPE_COLORS[0], points: values.input },
            { id: 'vout', label: 'CH2 · Vout', color: SCOPE_COLORS[1], points: values.output },
          ];
        }} />
    </> : <p role="status">{t('invalid')}</p>}
    <p className={styles.hint}>{t(`${kind}.hint`)} {t('animationHint')}</p>
  </div>;
}
