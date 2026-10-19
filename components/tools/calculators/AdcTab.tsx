import { Card } from 'antd';
import styles from '../embeddedCalculators.module.css';
import { ResultBar } from './Primitives';
import { NumberField } from './NumberField';
import { formatOhm } from './calc';
import { DividerReadout } from '@/components/electronics/DividerReadout';
import { useTranslations } from 'next-intl';
import { AdcSchematic } from './viz/circuits';
import { ESeriesControl } from './ESeriesControl';
import type { CalculatorState } from './useCalculatorState';

export function AdcTab({ c }: { c: CalculatorState }) {
  const { t } = c;
  const te = useTranslations('Electronics');
  const tolerance = Number(c.get('adcTolerancePct'));
  const choice = c.adcChoice;
  return (
    <Card title={t('cards.adc.title')} style={c.calcCardStyle} styles={{ body: c.calcCardBodyStyle }}>
      <ESeriesControl c={c} />
      <ResultBar
        label={t('cards.adc.rtop')}
        value={choice ? formatOhm(choice.resistance) : '—'}
        hint={choice ? `${c.eSeries} · ${te('ideal')}: ${formatOhm(choice.ideal)} · ${te('limitSelection')}` : ''}
        invalid={!choice}
        invalidText={t('cards.invalid')}
      />
      <div className={styles.fullRow} style={{ marginTop: 16, maxWidth: 360, marginInline: 'auto' }}>
        <AdcSchematic
          rTopText={choice ? formatOhm(choice.resistance) : '—'}
          rBotText={`${c.rBottomK} kΩ`}
        />
      </div>
      <DividerReadout voltage={choice?.voltage ?? null} />
      <div className={styles.fieldGrid}>
        <NumberField label={t('cards.adc.vin')} value={c.vinMax} onChange={c.setVinMax} min={0} step={0.1} sliderMin={0} sliderMax={60} sliderStep={0.1} />
        <NumberField label={t('cards.adc.vadc')} value={c.vadcMax} onChange={c.setVadcMax} min={0} step={0.1} sliderMin={0} sliderMax={5} sliderStep={0.05} />
        <NumberField label={t('cards.adc.rbottom')} value={c.rBottomK} onChange={c.setRBottomK} min={0.1} step={0.1} sliderMin={0.1} sliderMax={100} sliderStep={0.1} />
        <NumberField label={te('tolerance')} value={tolerance} onChange={(value) => c.set('adcTolerancePct', value)} min={0} max={20} step={0.1} />
      </div>
    </Card>
  );
}
