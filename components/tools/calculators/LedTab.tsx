import { Card, InputNumber } from 'antd';
import styles from '../embeddedCalculators.module.css';
import { ResultBar, Field } from './Primitives';
import { formatOhm, nearestE24 } from './calc';
import { LedSchematic } from './viz/circuits';
import type { CalculatorState } from './useCalculatorState';

export function LedTab({ c }: { c: CalculatorState }) {
  const { t } = c;
  const e24 = nearestE24(c.led.resistance);
  return (
    <Card title={t('cards.led.title')} style={c.calcCardStyle} styles={{ body: c.calcCardBodyStyle }}>
      <ResultBar
        label={t('cards.led.r')}
        value={formatOhm(c.led.resistance)}
        hint={`${t('cards.led.p')}: ${(c.led.power * 1000).toFixed(1)} mW${
          e24 ? ` · ${t('cards.eseries')}: ${formatOhm(e24)}` : ''
        }`}
        invalid={!c.led.valid}
        invalidText={t('cards.invalid')}
      />
      <div className={styles.fullRow} style={{ marginTop: 16, maxWidth: 420, marginInline: 'auto' }}>
        <LedSchematic rText={formatOhm(c.led.resistance)} vfText={`${c.ledVf} V`} />
      </div>
      <div className={styles.fieldGrid}>
        <Field label={t('cards.led.vs')}>
          <InputNumber value={c.supply} onChange={(v) => c.setSupply(Number(v || 0))} min={0} style={c.inputStyle} />
        </Field>
        <Field label={t('cards.led.vf')}>
          <InputNumber value={c.ledVf} onChange={(v) => c.setLedVf(Number(v || 0))} min={0} style={c.inputStyle} />
        </Field>
        <Field label={t('cards.led.current')}>
          <InputNumber value={c.ledCurrent} onChange={(v) => c.setLedCurrent(Number(v || 0))} min={1} style={c.inputStyle} />
        </Field>
      </div>
    </Card>
  );
}
