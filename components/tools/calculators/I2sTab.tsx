import { Card, InputNumber } from 'antd';
import styles from '../embeddedCalculators.module.css';
import { ResultBar, Field } from './Primitives';
import type { CalculatorState } from './useCalculatorState';

export function I2sTab({ c }: { c: CalculatorState }) {
  const { t } = c;
  return (
    <Card title={t('cards.i2s.title')} style={c.calcCardStyle} styles={{ body: c.calcCardBodyStyle }}>
      <ResultBar
        label="BCLK"
        value={`${Math.round(c.i2s.bclk).toLocaleString()} Hz`}
        hint={`MCLK: ${Math.round(c.i2s.mclk).toLocaleString()} Hz · ${t('cards.i2s.rate')}: ${c.i2s.bitRateMbps.toFixed(3)} Mbps`}
      />
      <div className={styles.fieldGrid}>
        <Field label={t('cards.i2s.fs')}>
          <InputNumber value={c.sampleRate} onChange={(v) => c.setSampleRate(Number(v || 0))} min={8000} style={c.inputStyle} />
        </Field>
        <Field label={t('cards.i2s.bits')}>
          <InputNumber value={c.bitDepth} onChange={(v) => c.setBitDepth(Number(v || 0))} min={8} step={8} style={c.inputStyle} />
        </Field>
        <Field label={t('cards.i2s.channels')}>
          <InputNumber value={c.channels} onChange={(v) => c.setChannels(Number(v || 0))} min={1} max={2} style={c.inputStyle} />
        </Field>
        <Field label={t('cards.i2s.mclk')}>
          <InputNumber value={c.mclkMult} onChange={(v) => c.setMclkMult(Number(v || 0))} min={64} step={64} style={c.inputStyle} />
        </Field>
      </div>
    </Card>
  );
}
