import { Card, InputNumber, Select } from 'antd';
import styles from '../embeddedCalculators.module.css';
import { ResultBar, Field } from './Primitives';
import { formatOhm } from './calc';
import { ResistorPackageType, ResistorVisualizer } from '../ResistorVisualizer';
import { BandOption, digitOptions, multiplierOptions, toleranceOptions } from './resistorOptions';
import type { CalculatorState } from './useCalculatorState';

function ColorOption({ name, suffix, color }: { name: string; suffix: string; color: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <span
        style={{
          width: 12,
          height: 12,
          borderRadius: 3,
          background: color,
          border: color.toLowerCase() === '#ffffff' ? '1px solid rgba(0,0,0,0.35)' : '1px solid rgba(255,255,255,0.2)',
          display: 'inline-block',
        }}
      />
      <span>{`${name} ${suffix}`}</span>
    </span>
  );
}

export function ResistorLabTab({ c }: { c: CalculatorState }) {
  const { t } = c;

  const colorOf = (options: BandOption[], value: string, fallback: string) =>
    options.find((o) => o.value === value)?.color || fallback;

  const selectedBandColors = [
    colorOf(digitOptions, c.band1, '#ff0000'),
    colorOf(digitOptions, c.band2, '#ff0000'),
    colorOf(multiplierOptions, c.multiplierBand, '#ff0000'),
    colorOf(toleranceOptions, c.toleranceBand, '#d4af37'),
  ];

  const metaFor = (options: BandOption[], value: string, suffix: string) => {
    const option = options.find((item) => item.value === value) || options[0];
    return { value, label: <ColorOption name={t(`colors.${option.key}`)} suffix={suffix} color={option.color} /> };
  };

  const bandSelect = (
    options: BandOption[],
    value: string,
    onChange: (v: string) => void,
    suffix: (v: string) => string
  ) => (
    <Select
      labelInValue
      onChange={(item) => onChange(String(item.value))}
      value={metaFor(options, value, suffix(value))}
      size="large"
      options={options.map((o) => ({
        value: o.value,
        label: <ColorOption name={t(`colors.${o.key}`)} suffix={suffix(o.value)} color={o.color} />,
      }))}
    />
  );

  return (
    <Card title={t('cards.resistorLab.title')} style={c.calcCardStyle} styles={{ body: c.calcCardBodyStyle }}>
      <ResultBar
        label={t('cards.resistorLab.value')}
        value={formatOhm(c.resistorValue)}
        hint={`±${c.resistorTolerance}% · ${t('cards.resistorLab.range')}: ${formatOhm(c.resistorMin)} - ${formatOhm(c.resistorMax)}`}
      />
      <div className={styles.fullRow} style={{ marginTop: 16 }}>
        <ResistorVisualizer
          packageType={c.packageType}
          wattage={c.wattage}
          resistorValue={c.resistorValue}
          tolerance={c.resistorTolerance}
          bandColors={selectedBandColors}
          smdCode={c.smdCode}
        />
      </div>
      <div className={styles.fieldGrid}>
        <Field label={t('cards.resistorLab.target')}>
          <InputNumber
            value={c.resistorValue}
            onChange={(v) => c.applyTargetValue(Number(v || 0))}
            min={0.01}
            step={1}
            style={c.inputStyle}
            addonAfter="Ω"
          />
        </Field>
        <Field label={t('cards.resistorLab.band1')}>
          {bandSelect(digitOptions, c.band1, c.setBand1, (v) => `(${v})`)}
        </Field>
        <Field label={t('cards.resistorLab.band2')}>
          {bandSelect(digitOptions, c.band2, c.setBand2, (v) => `(${v})`)}
        </Field>
        <Field label={t('cards.resistorLab.multiplier')}>
          {bandSelect(multiplierOptions, c.multiplierBand, c.setMultiplierBand, (v) => `(x${v})`)}
        </Field>
        <Field label={t('cards.resistorLab.tolerance')}>
          {bandSelect(toleranceOptions, c.toleranceBand, c.setToleranceBand, (v) => `(±${v}%)`)}
        </Field>
        <Field label={t('cards.resistorLab.package')}>
          <Select
            size="large"
            value={c.packageType}
            onChange={(value) => c.setPackageType(value as ResistorPackageType)}
            options={[
              { value: 'axial-carbon', label: t('cards.resistorLab.packages.axialCarbon') },
              { value: 'axial-metal', label: t('cards.resistorLab.packages.axialMetal') },
              { value: 'axial-ceramic', label: t('cards.resistorLab.packages.axialCeramic') },
              { value: 'axial-wirewound', label: t('cards.resistorLab.packages.wirewound') },
              { value: 'melf', label: t('cards.resistorLab.packages.melf') },
              { value: 'smd-0603', label: t('cards.resistorLab.packages.smd0603') },
              { value: 'smd-0805', label: t('cards.resistorLab.packages.smd0805') },
              { value: 'smd-1206', label: t('cards.resistorLab.packages.smd1206') },
            ]}
          />
        </Field>
        <Field label={t('cards.resistorLab.wattage')}>
          <InputNumber
            value={c.wattage}
            onChange={(v) => c.setWattage(Number(v || 0.25))}
            min={0.031}
            step={0.125}
            style={c.inputStyle}
            addonAfter="W"
            disabled={c.packageType.startsWith('smd')}
          />
        </Field>
        <div
          className={styles.fullRow}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.04)' }}
        >
          {selectedBandColors.map((color, idx) => (
            <span key={idx} style={{ width: 20, height: 28, borderRadius: 4, border: '1px solid rgba(255,255,255,0.2)', background: color }} />
          ))}
        </div>
        {c.packageType.startsWith('smd') && (
          <span className={`${styles.note} ${styles.fullRow}`}>
            {t('cards.resistorLab.smdCode')}: <strong>{c.smdCode}</strong>
          </span>
        )}
      </div>
    </Card>
  );
}
