import { Card } from 'antd';
import styles from '../embeddedCalculators.module.css';
import { ResultBar } from './Primitives';
import { NumberField } from './NumberField';
import { formatOhm } from './calc';
import { nearestStandard } from './eseries';
import { RcSchematic } from './viz/circuits';
import { Plot } from './viz/Plot';
import { rcLowpass } from './viz/responses';
import { ESeriesControl } from './ESeriesControl';
import type { CalculatorState } from './useCalculatorState';

export function RcTab({ c }: { c: CalculatorState }) {
  const { t } = c;
  const bode = rcLowpass(c.rcR, c.rcC);
  const std = c.requiredRValid ? nearestStandard(c.requiredR, c.eSeries) : null;
  const requiredHint = c.requiredRValid
    ? `${t('cards.rc.required')}: ${formatOhm(c.requiredR)}${std ? ` · ${t('cards.eseries')} ${c.eSeries}: ${formatOhm(std)}` : ''}`
    : `${t('cards.rc.required')}: —`;
  return (
    <Card title={t('cards.rc.title')} style={c.calcCardStyle} styles={{ body: c.calcCardBodyStyle }}>
      <ESeriesControl c={c} />
      <ResultBar
        label={t('cards.rc.fc')}
        value={`${c.cutoff.toFixed(1)} Hz`}
        hint={requiredHint}
        invalid={!c.cutoffValid}
        invalidText={t('cards.invalid')}
      />
      <div
        className={styles.fullRow}
        style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.4fr)', gap: 20, alignItems: 'center' }}
      >
        <RcSchematic rText={formatOhm(c.rcR)} cText={`${c.rcC} nF`} />
        <Plot
          series={[{ points: bode.mag, color: 'var(--accent)' }]}
          xLog
          xLabel="f"
          yLabel="|H|"
          yUnit="dB"
          mark={c.cutoffValid ? { x: bode.mark, label: `fc ${c.cutoff.toFixed(0)} Hz` } : undefined}
        />
      </div>
      <div className={styles.fieldGrid}>
        <NumberField label={t('cards.rc.r')} value={c.rcR} onChange={c.setRcR} min={1} inputStyle={c.inputStyle} />
        <NumberField label={t('cards.rc.c')} value={c.rcC} onChange={c.setRcC} min={0.1} step={0.1} sliderMin={0.1} sliderMax={1000} sliderStep={0.1} />
        <NumberField label={t('cards.rc.target')} value={c.targetFc} onChange={c.setTargetFc} min={1} inputStyle={c.inputStyle} />
      </div>
    </Card>
  );
}
