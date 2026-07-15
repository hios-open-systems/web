import { Card } from 'antd';
import styles from '../embeddedCalculators.module.css';
import { ResultBar } from './Primitives';
import { NumberField } from './NumberField';
import type { CalcDef } from './registry';
import type { CalculatorState } from './useCalculatorState';

/**
 * Render genérico de una calculadora declarada por completo en el registry: toma
 * los `fields` (inputs numéricos) y `result(get, t)` (líneas de salida) del
 * descriptor. Con esto, una calc nueva es solo un descriptor + su fórmula pura +
 * su i18n `cards.<id>.*` — sin componente a medida. Lo usan las calcs de obra,
 * clima, cotidianas y la Ley de Ohm.
 */
export function GenericCalcTab({ c, def }: { c: CalculatorState; def: CalcDef }) {
  const { t } = c;
  const lines = def.result ? def.result(c.get, t) : [];
  return (
    <Card title={t(`cards.${def.id}.title`)} style={c.calcCardStyle} styles={{ body: c.calcCardBodyStyle }}>
      {lines.map((ln, i) => (
        <div key={i} style={i > 0 ? { marginTop: 10 } : undefined}>
          <ResultBar
            label={ln.label}
            value={ln.value}
            hint={ln.hint}
            invalid={ln.invalid}
            invalidText={ln.invalidText}
          />
        </div>
      ))}
      <div className={styles.fieldGrid} style={{ marginTop: 18 }}>
        {def.fields.map((f) => (
          <NumberField
            key={f.key}
            label={t(`cards.${def.id}.${f.key}`)}
            value={Number(c.get(f.key))}
            onChange={(n) => c.set(f.key, n)}
            min={f.min}
            step={f.step}
            sliderMin={f.sliderMin}
            sliderMax={f.sliderMax}
            sliderStep={f.sliderStep}
            addonAfter={f.unit}
            inputStyle={f.unit ? { width: 150 } : undefined}
          />
        ))}
      </div>
    </Card>
  );
}
