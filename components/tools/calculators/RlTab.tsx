import { Card, InputNumber } from 'antd';
import styles from '../embeddedCalculators.module.css';
import { ResultBar, Field } from './Primitives';
import { RlSchematic } from './viz/circuits';
import { Plot } from './viz/Plot';
import { rlLowpass } from './viz/responses';
import type { CalculatorState } from './useCalculatorState';

export function RlTab({ c }: { c: CalculatorState }) {
  const { t } = c;
  const bode = rlLowpass(c.rlR, c.rlL);
  const requiredHint = c.rlRequiredValid
    ? `${t('cards.rl.required')}: ${c.rlRequiredL.toFixed(2)} mH`
    : `${t('cards.rl.required')}: —`;

  return (
    <Card title={t('cards.rl.title')} style={c.calcCardStyle} styles={{ body: c.calcCardBodyStyle }}>
      <ResultBar
        label={t('cards.rl.fc')}
        value={`${c.rlFilter.fc.toFixed(1)} Hz`}
        hint={requiredHint}
        invalid={!c.rlFilter.valid}
        invalidText={t('cards.invalid')}
      />
      <div
        className={styles.fullRow}
        style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.4fr)', gap: 20, alignItems: 'center' }}
      >
        <RlSchematic rText={`${c.rlR} Ω`} lText={`${c.rlL} mH`} />
        <Plot
          series={[{ points: bode.mag, color: 'var(--accent-text)' }]}
          xLog
          xLabel="f"
          yLabel="|H|"
          yUnit="dB"
          mark={c.rlFilter.valid ? { x: bode.mark, label: `fc ${c.rlFilter.fc.toFixed(0)} Hz` } : undefined}
        />
      </div>
      <div className={styles.fieldGrid}>
        <Field label={t('cards.rl.r')}>
          <InputNumber value={c.rlR} onChange={(v) => c.setRlR(Number(v || 0))} min={1} style={c.inputStyle} />
        </Field>
        <Field label={t('cards.rl.l')}>
          <InputNumber value={c.rlL} onChange={(v) => c.setRlL(Number(v || 0))} min={0.001} step={0.1} style={c.inputStyle} />
        </Field>
        <Field label={t('cards.rl.target')}>
          <InputNumber value={c.rlTargetFc} onChange={(v) => c.setRlTargetFc(Number(v || 0))} min={1} style={c.inputStyle} />
        </Field>
      </div>
    </Card>
  );
}
