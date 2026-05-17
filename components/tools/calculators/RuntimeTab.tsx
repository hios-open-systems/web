import { Card, InputNumber } from 'antd';
import styles from '../embeddedCalculators.module.css';
import { ResultBar, Field } from './Primitives';
import type { CalculatorState } from './useCalculatorState';

export function RuntimeTab({ c }: { c: CalculatorState }) {
  const { t } = c;
  return (
    <Card title={t('cards.runtime.title')} style={c.calcCardStyle} styles={{ body: c.calcCardBodyStyle }}>
      <ResultBar
        label={t('cards.runtime.hours')}
        value={`${c.runtime.toFixed(1)} h`}
        hint={`${t('cards.runtime.days')}: ${(c.runtime / 24).toFixed(2)}`}
      />
      <div className={styles.fieldGrid}>
        <Field label={t('cards.runtime.battery')}>
          <InputNumber value={c.batteryMah} onChange={(v) => c.setBatteryMah(Number(v || 0))} min={0} style={c.inputStyle} />
        </Field>
        <Field label={t('cards.runtime.current')}>
          <InputNumber value={c.avgCurrent} onChange={(v) => c.setAvgCurrent(Number(v || 0))} min={1} style={c.inputStyle} />
        </Field>
        <Field label={t('cards.runtime.eff')}>
          <InputNumber value={c.efficiency} onChange={(v) => c.setEfficiency(Number(v || 0))} min={1} max={100} style={c.inputStyle} />
        </Field>
      </div>
    </Card>
  );
}
