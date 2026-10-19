import { useTranslations } from 'next-intl';
import { Card } from 'antd';
import styles from '../embeddedCalculators.module.css';
import { ResultBar } from './Primitives';
import { NumberField } from './NumberField';
import { formatOhm } from './calc';
import { LedSchematic } from './viz/circuits';
import { ESeriesControl } from './ESeriesControl';
import type { CalculatorState } from './useCalculatorState';

export function LedTab({ c }: { c: CalculatorState }) {
  const { t } = c;
  const te = useTranslations('Electronics');
  const choice = c.ledChoice;
  return (
    <Card title={t('cards.led.title')} style={c.calcCardStyle} styles={{ body: c.calcCardBodyStyle }}>
      <ESeriesControl c={c} />
      <ResultBar
        label={t('cards.led.r')}
        value={choice ? formatOhm(choice.resistance) : '—'}
        hint={choice ? `${c.eSeries} · ${te('ideal')}: ${formatOhm(choice.ideal)} · ${t('cards.led.p')}: ${(choice.power * 1000).toFixed(1)} mW` : ''}
        invalid={!choice}
        invalidText={t('cards.invalid')}
      />
      {choice ? <p data-led-commercial>{te('nominalCurrent')}: {choice.currentMa.toFixed(3)} mA · {te('nominalOnly')}</p> : null}
      <div className={styles.fullRow} style={{ marginTop: 16, maxWidth: 420, marginInline: 'auto' }}>
        <LedSchematic rText={choice ? formatOhm(choice.resistance) : '—'} vfText={`${c.ledVf} V`} />
      </div>
      <div className={styles.fieldGrid}>
        <NumberField label={t('cards.led.vs')} value={c.supply} onChange={c.setSupply} min={0} step={0.1} sliderMin={0} sliderMax={24} sliderStep={0.1} />
        <NumberField label={t('cards.led.vf')} value={c.ledVf} onChange={c.setLedVf} min={0} step={0.1} sliderMin={0} sliderMax={5} sliderStep={0.05} />
        <NumberField label={t('cards.led.current')} value={c.ledCurrent} onChange={c.setLedCurrent} min={1} sliderMin={1} sliderMax={50} sliderStep={1} />
      </div>
    </Card>
  );
}
