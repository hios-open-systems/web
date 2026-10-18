import React from 'react';
import { Button } from 'antd';
import { useTranslations } from 'next-intl';
import type { QpskSimConfig } from './types';
import { GRAY_ORDER, mapDibit, symbolSnrDb, theoreticalBer } from './qpskMath';
import { QpskSequence } from './QpskSequence';
import styles from './qpskSimulator.module.css';

type Props = { config: QpskSimConfig; onChange: (patch: Partial<QpskSimConfig>) => void };

function RangeControl({ label, value, min, max, step, onChange, unit = '', digits = 1 }: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (value: number) => void; unit?: string; digits?: number;
}) {
  return (
    <label className={styles.sliderField}>
      <span className={styles.controlLabelRow}><span style={{ textTransform: 'none' }}>{label}</span>
        <span className={styles.labelValue}>{value.toFixed(digits)}{unit}</span></span>
      <input type="range" aria-label={label} min={min} max={max} step={step}
        value={value} onChange={(e) => onChange(Number(e.target.value))} className={styles.sliderInput} />
    </label>
  );
}

function SignalControls({ config, onChange }: Props) {
  const t = useTranslations('Qpsk');
  const snr = symbolSnrDb(config.noiseLevel);
  const ber = theoreticalBer(config.noiseLevel);
  return (
    <div className={styles.controlGroup}>
      <RangeControl label={t('cycles')} value={config.cyclesPerSymbol} min={1} max={5} step={0.5}
        unit={' ' + t('cyclesUnit')} onChange={(cyclesPerSymbol) => onChange({ cyclesPerSymbol })} />
      <RangeControl label={t('noise')} value={config.noiseLevel} min={0} max={0.6} step={0.01}
        digits={2} onChange={(noiseLevel) => onChange({ noiseLevel })} />
      <div className={styles.grayRefBox} data-testid="qpsk-metrics">
        <div>{t('snr')}: {Number.isFinite(snr) ? snr.toFixed(2) : '∞'} dB</div>
        <div>{t('ber')}: {config.noiseLevel === 0 ? '0' : ber === 0 ? '< 10⁻³⁰⁰' : ber.toExponential(2)}</div>
      </div>
    </div>
  );
}

function PlaybackControls({ config, onChange }: Props) {
  const t = useTranslations('Qpsk');
  return (
    <div className={styles.controlGroup}>
      <RangeControl label={t('speed')} value={config.scrollSpeed} min={0} max={3} step={0.2}
        unit="x" onChange={(scrollSpeed) => onChange({ scrollSpeed })} />
      <label className={styles.checkboxLabel}>
        <input type="checkbox" checked={config.showReference}
          onChange={(e) => onChange({ showReference: e.target.checked })} />
        <span>{t('reference')}</span>
      </label>
      <label className={styles.checkboxLabel}>
        <input type="checkbox" checked={config.showTrajectories}
          onChange={(e) => onChange({ showTrajectories: e.target.checked })} />
        <span>{t('connections')}</span>
      </label>
      <Button className={styles.actionBtn} onClick={() => onChange({ running: !config.running })}>
        {t(config.running ? 'pause' : 'resume')}
      </Button>
      <span className={styles.bezelHint}>{t('pauseHint')}</span>
    </div>
  );
}

function GrayReference() {
  const t = useTranslations('Qpsk');
  return (
    <div className={styles.controlGroup}>
      <strong>{t('grayMapping')}</strong>
      <div className={styles.grayRefBox}>
        {GRAY_ORDER.map((dibit) => {
          const { I, Q, phaseDeg } = mapDibit(dibit);
          return <div key={dibit}>{dibit}: {phaseDeg}° ({I > 0 ? '+' : '−'}I, {Q > 0 ? '+' : '−'}Q)</div>;
        })}
      </div>
      <span className={styles.bezelHint}>{t('bitConvention')}</span>
    </div>
  );
}

export function QpskControls({ config, onChange }: Props) {
  return (
    <div className={styles.controlsPanel}>
      <QpskSequence dibits={config.dibits} onChange={(dibits) => onChange({ dibits })} />
      <SignalControls config={config} onChange={onChange} />
      <PlaybackControls config={config} onChange={onChange} />
      <GrayReference />
    </div>
  );
}
