import { Card, InputNumber } from 'antd';
import styles from '../embeddedCalculators.module.css';
import { ResultBar, Field } from './Primitives';
import type { CalculatorState } from './useCalculatorState';

export function AdcTab({ c }: { c: CalculatorState }) {
  const { t } = c;
  return (
    <Card title={t('cards.adc.title')} style={c.calcCardStyle} styles={{ body: c.calcCardBodyStyle }}>
      <ResultBar
        label={t('cards.adc.rtop')}
        value={`${c.divider.rTopK.toFixed(1)} kΩ`}
        hint={`${t('cards.adc.ratio')}: ${c.divider.ratio.toFixed(2)} : 1`}
        invalid={!c.divider.valid}
        invalidText={t('cards.invalid')}
      />
      <div className={styles.fieldGrid}>
        <Field label={t('cards.adc.vin')}>
          <InputNumber value={c.vinMax} onChange={(v) => c.setVinMax(Number(v || 0))} min={0} step={0.1} style={c.inputStyle} />
        </Field>
        <Field label={t('cards.adc.vadc')}>
          <InputNumber value={c.vadcMax} onChange={(v) => c.setVadcMax(Number(v || 0))} min={0} step={0.1} style={c.inputStyle} />
        </Field>
        <Field label={t('cards.adc.rbottom')}>
          <InputNumber value={c.rBottomK} onChange={(v) => c.setRBottomK(Number(v || 0))} min={0.1} step={0.1} style={c.inputStyle} />
        </Field>
      </div>
    </Card>
  );
}
