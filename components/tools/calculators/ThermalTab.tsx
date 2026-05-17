import { Card, InputNumber } from 'antd';
import styles from '../embeddedCalculators.module.css';
import { ResultBar, Field } from './Primitives';
import type { CalculatorState } from './useCalculatorState';

export function ThermalTab({ c }: { c: CalculatorState }) {
  const { t } = c;
  return (
    <Card title={t('cards.thermal.title')} style={c.calcCardStyle} styles={{ body: c.calcCardBodyStyle }}>
      <ResultBar
        label={t('cards.thermal.p')}
        value={`${c.thermal.power.toFixed(2)} W`}
        hint={`${t('cards.thermal.temp')}: ΔT ${c.thermal.rise.toFixed(1)} °C | Tj ${c.thermal.junction.toFixed(1)} °C`}
      />
      <div className={styles.fieldGrid}>
        <Field label={t('cards.thermal.v')}>
          <InputNumber value={c.powerV} onChange={(v) => c.setPowerV(Number(v || 0))} min={0} step={0.1} style={c.inputStyle} />
        </Field>
        <Field label={t('cards.thermal.i')}>
          <InputNumber value={c.powerI} onChange={(v) => c.setPowerI(Number(v || 0))} min={0} step={0.01} style={c.inputStyle} />
        </Field>
        <Field label={t('cards.thermal.theta')}>
          <InputNumber value={c.thetaJa} onChange={(v) => c.setThetaJa(Number(v || 0))} min={0} style={c.inputStyle} />
        </Field>
        <Field label={t('cards.thermal.ta')}>
          <InputNumber value={c.ambient} onChange={(v) => c.setAmbient(Number(v || 0))} style={c.inputStyle} />
        </Field>
      </div>
    </Card>
  );
}
