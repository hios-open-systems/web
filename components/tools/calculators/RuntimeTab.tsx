import { Card } from 'antd';
import styles from '../embeddedCalculators.module.css';
import { ResultBar } from './Primitives';
import { NumberField } from './NumberField';
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
        <NumberField label={t('cards.runtime.battery')} value={c.batteryMah} onChange={c.setBatteryMah} min={0} inputStyle={c.inputStyle} />
        <NumberField label={t('cards.runtime.current')} value={c.avgCurrent} onChange={c.setAvgCurrent} min={1} inputStyle={c.inputStyle} />
        <NumberField label={t('cards.runtime.eff')} value={c.efficiency} onChange={c.setEfficiency} min={1} max={100} sliderMin={1} sliderMax={100} sliderStep={1} />
      </div>
    </Card>
  );
}
