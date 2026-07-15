import { Card } from 'antd';
import styles from '../embeddedCalculators.module.css';
import { ResultBar } from './Primitives';
import { NumberField } from './NumberField';
import { formatOhm } from './calc';
import { nearestStandard } from './eseries';
import { LedSchematic } from './viz/circuits';
import { ESeriesControl } from './ESeriesControl';
import type { CalculatorState } from './useCalculatorState';

export function LedTab({ c }: { c: CalculatorState }) {
  const { t } = c;
  const std = nearestStandard(c.led.resistance, c.eSeries);
  return (
    <Card title={t('cards.led.title')} style={c.calcCardStyle} styles={{ body: c.calcCardBodyStyle }}>
      <ESeriesControl c={c} />
      <ResultBar
        label={t('cards.led.r')}
        value={formatOhm(c.led.resistance)}
        hint={`${t('cards.led.p')}: ${(c.led.power * 1000).toFixed(1)} mW${
          std ? ` · ${t('cards.eseries')} ${c.eSeries}: ${formatOhm(std)}` : ''
        }`}
        invalid={!c.led.valid}
        invalidText={t('cards.invalid')}
      />
      <div className={styles.fullRow} style={{ marginTop: 16, maxWidth: 420, marginInline: 'auto' }}>
        <LedSchematic rText={formatOhm(c.led.resistance)} vfText={`${c.ledVf} V`} />
      </div>
      <div className={styles.fieldGrid}>
        <NumberField label={t('cards.led.vs')} value={c.supply} onChange={c.setSupply} min={0} step={0.1} sliderMin={0} sliderMax={24} sliderStep={0.1} />
        <NumberField label={t('cards.led.vf')} value={c.ledVf} onChange={c.setLedVf} min={0} step={0.1} sliderMin={0} sliderMax={5} sliderStep={0.05} />
        <NumberField label={t('cards.led.current')} value={c.ledCurrent} onChange={c.setLedCurrent} min={1} sliderMin={1} sliderMax={50} sliderStep={1} />
      </div>
    </Card>
  );
}
