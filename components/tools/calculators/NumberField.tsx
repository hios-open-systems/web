import React from 'react';
import { InputNumber, Slider } from 'antd';
import styles from '../embeddedCalculators.module.css';

/**
 * Labelled numeric input with an optional coarse slider. The number box is
 * always free-form (you can type past the slider range); the slider just
 * gives quick tuning when a sensible bounded range exists. Without
 * slider min/max it degrades to a plain InputNumber, so every calculator
 * field can use one component.
 */
export function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step,
  sliderMin,
  sliderMax,
  sliderStep,
  addonAfter,
  disabled,
  inputStyle,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  step?: number;
  sliderMin?: number;
  sliderMax?: number;
  sliderStep?: number;
  addonAfter?: string;
  disabled?: boolean;
  inputStyle?: React.CSSProperties;
}) {
  const hasSlider = typeof sliderMin === 'number' && typeof sliderMax === 'number';
  const clamped = hasSlider ? Math.min(Math.max(value, sliderMin!), sliderMax!) : value;

  return (
    <div className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      {hasSlider ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Slider
            style={{ flex: 1, minWidth: 0 }}
            min={sliderMin}
            max={sliderMax}
            step={sliderStep ?? step ?? 1}
            value={clamped}
            onChange={(v) => onChange(Number(v))}
            disabled={disabled}
            tooltip={{ open: false }}
          />
          <InputNumber
            value={value}
            onChange={(v) => onChange(Number(v ?? 0))}
            min={min}
            max={max}
            step={step}
            addonAfter={addonAfter}
            disabled={disabled}
            style={{ width: 110, ...inputStyle }}
          />
        </div>
      ) : (
        <InputNumber
          value={value}
          onChange={(v) => onChange(Number(v ?? 0))}
          min={min}
          max={max}
          step={step}
          addonAfter={addonAfter}
          disabled={disabled}
          style={{ width: '100%', ...inputStyle }}
        />
      )}
    </div>
  );
}
