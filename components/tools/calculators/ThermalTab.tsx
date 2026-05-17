import { Card } from 'antd';
import styles from '../embeddedCalculators.module.css';
import { ResultBar } from './Primitives';
import { NumberField } from './NumberField';
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
        <NumberField label={t('cards.thermal.v')} value={c.powerV} onChange={c.setPowerV} min={0} step={0.1} sliderMin={0} sliderMax={24} sliderStep={0.1} />
        <NumberField label={t('cards.thermal.i')} value={c.powerI} onChange={c.setPowerI} min={0} step={0.01} sliderMin={0} sliderMax={5} sliderStep={0.01} />
        <NumberField label={t('cards.thermal.theta')} value={c.thetaJa} onChange={c.setThetaJa} min={0} sliderMin={0} sliderMax={150} sliderStep={1} />
        <NumberField label={t('cards.thermal.ta')} value={c.ambient} onChange={c.setAmbient} sliderMin={-20} sliderMax={85} sliderStep={1} />
      </div>
    </Card>
  );
}
