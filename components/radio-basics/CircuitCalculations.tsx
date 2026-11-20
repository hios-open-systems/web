'use client';

import { useTranslations } from 'next-intl';
import type { CircuitSettings, CircuitResult } from '@/lib/electronics/dcCircuit';
import styles from './circuitLab.module.css';

interface Props {
  settings: CircuitSettings;
  result: CircuitResult;
  format: (value: number, digits?: number) => string;
}

function resistanceEquation({ settings: s, result: r, format: f }: Props): string {
  if (!Number.isFinite(r.equivalent)) return 'Rₑq = ∞ Ω';
  if (s.mode === 'single' || (s.mode === 'parallel' && !s.connected)) return `Rₑq = R1 = ${f(s.r1)} Ω`;
  if (s.mode === 'series') return `Rₑq = R1 + R2 = ${f(s.r1)} + ${f(s.r2)} = ${f(r.equivalent)} Ω`;
  return `Rₑq = (R1 × R2) / (R1 + R2) = (${f(s.r1)} × ${f(s.r2)}) / (${f(s.r1)} + ${f(s.r2)}) ≈ ${f(r.equivalent)} Ω`;
}

export function CircuitCalculations(props: Props) {
  const t = useTranslations('RadioBasics.lab');
  const { result: r, settings: s, format: f } = props;
  const why = !s.powered ? 'sourceOff' : !s.connected && s.mode !== 'single'
    ? s.mode === 'series' ? 'openSeries' : 'openParallel'
    : `${s.mode}Why`;
  return <div className={styles.calculations}>
    <h4>{t('calculation')}</h4>
    <ol>
      <li><span>{t('resistanceStep')}</span><code>{resistanceEquation(props)}</code></li>
      <li><span>{t('currentStep')}</span><code>I = V / Rₑq ≈ {f(r.sourceVoltage)} / {f(r.equivalent)} ≈ {f(r.current, 4)} A ≈ {f(r.current * 1000)} mA</code></li>
      <li><span>{t('powerStep')}</span><code>P = V × I ≈ {f(r.sourceVoltage)} × {f(r.current, 4)} ≈ {f(r.power, 4)} W</code></li>
    </ol>
    <p className={styles.explanation}>{t(why)}</p>
    <p className={styles.note}>{t('powerNotice')}</p>
  </div>;
}
