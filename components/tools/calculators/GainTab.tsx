import { Card, InputNumber } from 'antd';
import styles from '../embeddedCalculators.module.css';
import { ResultBar, Field } from './Primitives';
import type { CalculatorState } from './useCalculatorState';

export function GainTab({ c }: { c: CalculatorState }) {
  const { t } = c;
  return (
    <Card title={t('cards.gain.title')} style={c.calcCardStyle} styles={{ body: c.calcCardBodyStyle }}>
      <ResultBar
        label={t('cards.gain.value')}
        value={`${c.gain.gain.toFixed(2)} x`}
        hint={`${t('cards.gain.db')}: ${c.gain.gainDb.toFixed(2)} dB`}
      />
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
