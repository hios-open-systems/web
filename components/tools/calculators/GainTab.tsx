import { Card, InputNumber } from 'antd';
import { useTranslations } from 'next-intl';
import styles from '../embeddedCalculators.module.css';
import { ResultBar, Field } from './Primitives';
import { AmpSchematic } from './viz/circuits';
import { Plot } from './viz/Plot';
import { ampFlat } from './viz/responses';
import { GainScope } from './GainScope';
import type { CalculatorState } from './useCalculatorState';

export function GainTab({ c }: { c: CalculatorState }) {
  const { t } = c;
  const instrument = useTranslations('Instrument.gain');
  const flat = ampFlat(c.gain.valid ? c.gain.gainDb : NaN);
  return (
    <Card title={t('cards.gain.title')} style={c.calcCardStyle} styles={{ body: c.calcCardBodyStyle }}>
      <ResultBar
        label={t('cards.gain.value')}
        value={`${c.gain.gain.toFixed(2)} x`}
        hint={`${t('cards.gain.db')}: ${c.gain.gainDb.toFixed(2)} dB`}
        invalid={!c.gain.valid} invalidText={t('cards.invalid')}
      />
      <div className={`${styles.fullRow} ${styles.visualRow}`}>
        <AmpSchematic
          ariaLabel={instrument('schematic')}
          rfText={`${c.rf} Ω`}
          rgText={`${c.rg} Ω`}
          gainText={c.gain.valid ? `${c.gain.gain.toFixed(2)}×` : '—'}
        />
        <Plot
          series={[{ points: flat.mag }]}
          xLog
          xLabel="f"
          yLabel="Av"
          yUnit="dB"
        />
      </div>
      <div className={styles.fieldGrid}>
        <Field label={t('cards.gain.rf')}>
          <InputNumber aria-label={t('cards.gain.rf')} value={c.rf} onChange={(v) => c.setRf(Number(v || 0))} min={0} style={c.inputStyle} />
        </Field>
        <Field label={t('cards.gain.rg')}>
          <InputNumber aria-label={t('cards.gain.rg')} value={c.rg} onChange={(v) => c.setRg(Number(v || 0))} min={1} style={c.inputStyle} />
        </Field>
        <span className={`${styles.note} ${styles.fullRow}`}>{t('cards.gain.formula')}</span>
      </div>
      <GainScope c={c} />
    </Card>
  );
}
