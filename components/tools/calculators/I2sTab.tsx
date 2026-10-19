import { Card, InputNumber, Select } from 'antd';
import { I2sScope } from '@/components/instruments/I2sScope';
import { I2S_SLOT_BITS } from '@/lib/instruments/i2s';
import styles from '../embeddedCalculators.module.css';
import { ResultBar, Field } from './Primitives';
import type { CalculatorState } from './useCalculatorState';

export function I2sTab({ c }: { c: CalculatorState }) {
  const { t } = c;
  return (
    <Card title={t('cards.i2s.title')} style={c.calcCardStyle} styles={{ body: c.calcCardBodyStyle }}>
      <ResultBar
        label="BCLK"
        value={c.i2s.valid ? `${Math.round(c.i2s.bclk).toLocaleString()} Hz` : '—'}
        hint={c.i2s.valid ? `${t('cards.i2s.nominalMclk')}: ${Math.round(c.i2s.mclk).toLocaleString()} Hz · ${t('cards.i2s.rate')}: ${c.i2s.bitRateMbps.toFixed(3)} Mbps · ${t('cards.i2s.payloadRate')}: ${c.i2s.payloadBitRateMbps.toFixed(3)} Mbps` : t('cards.i2s.invalid')}
      />
      <div className={styles.fieldGrid}>
        <Field label={t('cards.i2s.fs')}>
          <InputNumber aria-label={t('cards.i2s.fs')} value={c.sampleRate} onChange={(v) => c.setSampleRate(Number(v || 0))} min={8000} style={c.inputStyle} />
        </Field>
        <Field label={t('cards.i2s.bits')}>
          <Select aria-label={t('cards.i2s.bits')} value={c.bitDepth} onChange={c.setBitDepth} options={[8, 16, 24, 32].map((value) => ({ value, label: String(value) }))} style={c.inputStyle} />
        </Field>
        <Field label={t('cards.i2s.slotBits')}>
          <Select aria-label={t('cards.i2s.slotBits')} value={Number(c.get('i2sSlotBits'))} onChange={(value) => c.set('i2sSlotBits', value)} options={I2S_SLOT_BITS.map((value) => ({ value, label: String(value) }))} style={c.inputStyle} />
        </Field>
        <Field label={t('cards.i2s.channels')}>
          <InputNumber aria-label={t('cards.i2s.channels')} value={c.channels} onChange={(v) => c.setChannels(Number(v || 0))} min={1} max={2} precision={0} style={c.inputStyle} />
        </Field>
        <Field label={t('cards.i2s.mclk')}>
          <InputNumber aria-label={t('cards.i2s.mclk')} value={c.mclkMult} onChange={(v) => c.setMclkMult(Number(v || 0))} min={64} step={64} precision={0} style={c.inputStyle} />
        </Field>
      </div>
      <p>{t('cards.i2s.modelHint')}</p>
      <I2sScope model={c.i2s.model} />
    </Card>
  );
}
