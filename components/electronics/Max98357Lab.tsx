'use client';

import { useId, useState } from 'react';
import { Button, InputNumber, Select } from 'antd';
import { useTranslations } from 'next-intl';
import { max98357Sd, rightChannelResistor, MAX_SD_RIGHT_RESISTOR } from '@/lib/electronics/max98357';
import { DividerReadout } from './DividerReadout';
import styles from './electronics.module.css';

function NumericField({ label, value, onChange, min, max }: {
  label: string; value: number | null; onChange: (value: number | null) => void; min: number; max?: number;
}) {
  const id = useId();
  return <div className={styles.field}><label htmlFor={id}>{label}</label>
    <InputNumber id={id} value={value} onChange={onChange} min={min} max={max} step={0.1} style={{ width: '100%' }} />
  </div>;
}

export function Max98357Lab() {
  const t = useTranslations('Electronics');
  const [supply, setSupply] = useState<number | null>(5);
  const [external, setExternal] = useState<number | null>(MAX_SD_RIGHT_RESISTOR / 1000);
  const [onboard, setOnboard] = useState<number | null>(0);
  const [tolerance, setTolerance] = useState<number | null>(5);
  const [connection, setConnection] = useState<'resistor' | 'open' | 'direct'>('resistor');
  const id = useId();
  const config = { supply: supply ?? NaN, tolerancePct: tolerance ?? NaN,
    onboard: onboard === 0 ? null : (onboard ?? NaN) * 1000,
    external: connection === 'open' ? null : connection === 'direct' ? 0 : (external ?? NaN) * 1000 };
  const model = max98357Sd(config);
  const suggested = rightChannelResistor(config.supply, config.onboard, config.tolerancePct);
  return <section className={styles.panel} data-max98357-lab aria-labelledby={`${id}-title`}>
    <h3 id={`${id}-title`}>{t('max.title')}</h3>
    <p>{t('max.description')}</p>
    <div className={styles.fields}>
      <NumericField label={t('max.supply')} value={supply} onChange={setSupply} min={2.5} max={5.5} />
      <div className={styles.field}><label htmlFor={`${id}-connection`}>{t('max.connection')}</label>
        <Select id={`${id}-connection`} value={connection} onChange={setConnection}
          options={(['resistor', 'open', 'direct'] as const).map((value) => ({ value, label: t(`max.${value}`) }))} />
      </div>
      {connection === 'resistor' ? <NumericField label={t('max.external')} value={external} onChange={setExternal} min={0.1} /> : null}
      <NumericField label={t('max.onboard')} value={onboard} onChange={setOnboard} min={0} />
      <NumericField label={t('tolerance')} value={tolerance} onChange={setTolerance} min={0} max={20} />
    </div>
    <Button disabled={suggested === null} onClick={() => { setConnection('resistor'); setExternal(suggested! / 1000); }}>
      {t('max.recommend')}{suggested === null ? '' : `: ${suggested / 1000} kΩ`}
    </Button>
    {suggested === null ? <p>{t('max.noRecommendation')}</p> : null}
    <DividerReadout voltage={model?.voltage ?? null} />
    {model ? <p data-sd-channel aria-live="polite">{t('max.channel')}: <strong>{t(`max.${model.nominalChannel}`)}</strong>
      {' · '}{model.stableChannel ? t('max.stable') : t('max.uncertain')}</p> : null}
    <p>{t('max.assumptions')}</p>
  </section>;
}
