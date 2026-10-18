import { Card, InputNumber } from 'antd';
import { useTranslations } from 'next-intl';
import styles from '../embeddedCalculators.module.css';
import { ResultBar, Field } from './Primitives';
import { RclSchematic } from './viz/circuits';
import { Plot } from './viz/Plot';
import { rclImpedance } from './viz/responses';
import { RclScope } from './RclScope';
import type { CalculatorState } from './useCalculatorState';

export function RclTab({ c }: { c: CalculatorState }) {
  const r = useTranslations('CalculatorsRCL');
  const instrument = useTranslations('Instrument.rcl');
  const curve = rclImpedance(c.rclR, c.rclL, c.rclC);

  return (
    <Card title={c.t('cards.rcl.title')} style={c.calcCardStyle} styles={{ body: c.calcCardBodyStyle }}>
      <ResultBar
        label={r('z')}
        value={`${c.rcl.z.toFixed(2)} Ω`}
        hint={`${r('xl')}: ${c.rcl.xl.toFixed(2)} Ω · ${r('xc')}: ${c.rcl.xc.toFixed(2)} Ω · ${r('f0')}: ${c.rcl.f0.toFixed(1)} Hz · ${r('q')}: ${c.rcl.q === Infinity ? '∞' : c.rcl.q.toFixed(2)}`}
        invalid={!c.rcl.valid}
        invalidText={c.t('cards.invalid')}
      />
      <div className={`${styles.fullRow} ${styles.visualRow}`} >
        <RclSchematic
          ariaLabel={instrument('schematic')}
          rText={`${c.rclR} Ω`}
          lText={`${c.rclL} mH`}
          cText={`${c.rclC} µF`}
        />
        <Plot
          series={[{ points: curve.mag }]}
          xLog
          xLabel="f"
          yLabel="|Z|"
          yUnit="Ω"
          mark={c.rcl.f0 > 0 ? { x: curve.mark, label: `f0 ${c.rcl.f0.toFixed(0)} Hz` } : undefined}
        />
      </div>
      <div className={styles.fieldGrid}>
        <Field label={r('r_ohm')}>
          <InputNumber aria-label={r('r_ohm')} value={c.rclR} onChange={(v) => c.setRclR(Number(v || 0))} min={0} style={c.inputStyle} />
        </Field>
        <Field label={r('l_mh')}>
          <InputNumber aria-label={r('l_mh')} value={c.rclL} onChange={(v) => c.setRclL(Number(v || 0))} min={0.001} step={0.1} style={c.inputStyle} />
        </Field>
        <Field label={r('c_uf')}>
          <InputNumber aria-label={r('c_uf')} value={c.rclC} onChange={(v) => c.setRclC(Number(v || 0))} min={0.001} step={0.1} style={c.inputStyle} />
        </Field>
        <Field label={r('freq_hz')}>
          <InputNumber aria-label={r('freq_hz')} value={c.rclF} onChange={(v) => c.setRclF(Number(v || 0))} min={1} style={c.inputStyle} />
        </Field>
        <span className={`${styles.note} ${styles.fullRow}`}>{r('notes')}</span>
      </div>
      <RclScope c={c} />
    </Card>
  );
}
