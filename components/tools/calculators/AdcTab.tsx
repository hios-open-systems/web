import { Card } from 'antd';
import styles from '../embeddedCalculators.module.css';
import { ResultBar } from './Primitives';
import { NumberField } from './NumberField';
import { formatOhm } from './calc';
import { nearestStandard } from './eseries';
import { AdcSchematic } from './viz/circuits';
import type { CalculatorState } from './useCalculatorState';

export function AdcTab({ c }: { c: CalculatorState }) {
  const { t } = c;
  const std = c.divider.valid ? nearestStandard(c.divider.rTopK * 1000, c.eSeries) : null;
  return (
    <Card title={t('cards.adc.title')} style={c.calcCardStyle} styles={{ body: c.calcCardBodyStyle }}>
      <ResultBar
        label={t('cards.adc.rtop')}
        value={`${c.divider.rTopK.toFixed(1)} kΩ`}
        hint={`${t('cards.adc.ratio')}: ${c.divider.ratio.toFixed(2)} : 1${
          std ? ` · ${t('cards.eseries')} ${c.eSeries}: ${formatOhm(std)}` : ''
        }`}
        invalid={!c.divider.valid}
        invalidText={t('cards.invalid')}
      />
      <div className={styles.fullRow} style={{ marginTop: 16, maxWidth: 360, marginInline: 'auto' }}>
        <AdcSchematic
          rTopText={`${c.divider.rTopK.toFixed(1)} kΩ`}
          rBotText={`${c.rBottomK} kΩ`}
        />
      </div>
      <div className={styles.fieldGrid}>
        <NumberField label={t('cards.adc.vin')} value={c.vinMax} onChange={c.setVinMax} min={0} step={0.1} sliderMin={0} sliderMax={60} sliderStep={0.1} />
        <NumberField label={t('cards.adc.vadc')} value={c.vadcMax} onChange={c.setVadcMax} min={0} step={0.1} sliderMin={0} sliderMax={5} sliderStep={0.05} />
        <NumberField label={t('cards.adc.rbottom')} value={c.rBottomK} onChange={c.setRBottomK} min={0.1} step={0.1} sliderMin={0.1} sliderMax={100} sliderStep={0.1} />
      </div>
    </Card>
  );
}
