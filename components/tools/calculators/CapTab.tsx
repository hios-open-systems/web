import { Card, InputNumber } from 'antd';
import styles from '../embeddedCalculators.module.css';
import { ResultBar, Field } from './Primitives';
import type { CalculatorState } from './useCalculatorState';

export function CapTab({ c }: { c: CalculatorState }) {
  const { t } = c;
  return (
    <Card title={t('cards.cap.title')} style={c.calcCardStyle} styles={{ body: c.calcCardBodyStyle }}>
      <ResultBar
        label={t('cards.cap.result')}
        value={`${(c.capacitor.value * 1e6).toFixed(1)} µF`}
        hint={t('cards.cap.formula')}
        invalid={!c.capacitor.valid}
        invalidText={t('cards.invalid')}
      />
      <div className={styles.fieldGrid}>
        <Field label={t('cards.cap.current')}>
          <InputNumber value={c.rippleCurrent} onChange={(v) => c.setRippleCurrent(Number(v || 0))} min={0} style={c.inputStyle} />
        </Field>
        <Field label={t('cards.cap.ripple')}>
          <InputNumber value={c.rippleDeltaV} onChange={(v) => c.setRippleDeltaV(Number(v || 0))} min={0.001} step={0.01} style={c.inputStyle} />
        </Field>
        <Field label={t('cards.cap.freq')}>
          <InputNumber value={c.rippleFreq} onChange={(v) => c.setRippleFreq(Number(v || 0))} min={1} style={c.inputStyle} />
        </Field>
      </div>
    </Card>
  );
}
