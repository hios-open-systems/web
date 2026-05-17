import { Card, InputNumber } from 'antd';
import styles from '../embeddedCalculators.module.css';
import { ResultBar, Field } from './Primitives';
import { formatOhm, nearestE24 } from './calc';
import type { CalculatorState } from './useCalculatorState';

export function RcTab({ c }: { c: CalculatorState }) {
  const { t } = c;
  const e24 = c.requiredRValid ? nearestE24(c.requiredR) : null;
  const requiredHint = c.requiredRValid
    ? `${t('cards.rc.required')}: ${formatOhm(c.requiredR)}${e24 ? ` · ${t('cards.eseries')}: ${formatOhm(e24)}` : ''}`
    : `${t('cards.rc.required')}: —`;
  return (
    <Card title={t('cards.rc.title')} style={c.calcCardStyle} styles={{ body: c.calcCardBodyStyle }}>
      <ResultBar
        label={t('cards.rc.fc')}
        value={`${c.cutoff.toFixed(1)} Hz`}
        hint={requiredHint}
        invalid={!c.cutoffValid}
        invalidText={t('cards.invalid')}
      />
      <div className={styles.fieldGrid}>
        <Field label={t('cards.rc.r')}>
          <InputNumber value={c.rcR} onChange={(v) => c.setRcR(Number(v || 0))} min={1} style={c.inputStyle} />
        </Field>
        <Field label={t('cards.rc.c')}>
          <InputNumber value={c.rcC} onChange={(v) => c.setRcC(Number(v || 0))} min={0.1} step={0.1} style={c.inputStyle} />
        </Field>
        <Field label={t('cards.rc.target')}>
          <InputNumber value={c.targetFc} onChange={(v) => c.setTargetFc(Number(v || 0))} min={1} style={c.inputStyle} />
        </Field>
      </div>
    </Card>
  );
}
