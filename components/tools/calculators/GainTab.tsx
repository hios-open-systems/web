import { Card, InputNumber } from 'antd';
import styles from '../embeddedCalculators.module.css';
import { ResultBar, Field } from './Primitives';
import { AmpSchematic } from './viz/circuits';
import { Plot } from './viz/Plot';
import { ampFlat } from './viz/responses';
import type { CalculatorState } from './useCalculatorState';

export function GainTab({ c }: { c: CalculatorState }) {
  const { t } = c;
  const flat = ampFlat(c.gain.gainDb);
  return (
    <Card title={t('cards.gain.title')} style={c.calcCardStyle} styles={{ body: c.calcCardBodyStyle }}>
      <ResultBar
        label={t('cards.gain.value')}
        value={`${c.gain.gain.toFixed(2)} x`}
        hint={`${t('cards.gain.db')}: ${c.gain.gainDb.toFixed(2)} dB`}
      />
      <div
        className={styles.fullRow}
        style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.2fr)', gap: 20, alignItems: 'center' }}
      >
        <AmpSchematic
          rfText={`${c.rf} Ω`}
          rgText={`${c.rg} Ω`}
          gainText={`${c.gain.gain.toFixed(2)}×`}
        />
        <Plot
          series={[{ points: flat.mag, color: 'var(--accent)' }]}
          xLog
          xLabel="f"
          yLabel="Av"
          yUnit="dB"
        />
      </div>
      <div className={styles.fieldGrid}>
        <Field label={t('cards.gain.rf')}>
          <InputNumber value={c.rf} onChange={(v) => c.setRf(Number(v || 0))} min={0} style={c.inputStyle} />
        </Field>
        <Field label={t('cards.gain.rg')}>
          <InputNumber value={c.rg} onChange={(v) => c.setRg(Number(v || 0))} min={1} style={c.inputStyle} />
        </Field>
        <span className={`${styles.note} ${styles.fullRow}`}>{t('cards.gain.formula')}</span>
      </div>
    </Card>
  );
}
