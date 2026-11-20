'use client';

import { useId } from 'react';
import { useTranslations } from 'next-intl';
import type { CircuitResult, CircuitSettings } from '@/lib/electronics/dcCircuit';
import styles from './circuitLab.module.css';

interface Props {
  settings: CircuitSettings;
  result: CircuitResult;
  format: (value: number, digits?: number) => string;
}

function Source({ voltage, format }: { voltage: number; format: Props['format'] }) {
  return <g>
    <path d="M55 60V143 M55 160V260" className={styles.wire} />
    <path d="M34 143H76 M44 160H66" className={styles.source} />
    <text x="82" y="147">+</text><text x="82" y="169">−</text>
    <text x="90" y="225">{format(voltage)} V</text>
  </g>;
}

function ParallelCircuit({ settings, result, format }: Props) {
  const t = useTranslations('RadioBasics.lab');
  return <g>
    <path d="M55 60H365 M55 260H365 M205 60V138 M205 204V260 M365 204V260" className={styles.wire} />
    <path d={settings.connected ? 'M365 60V138' : 'M365 60V80 M365 113V138'} className={styles.wire} />
    {!settings.connected && <path d="M365 80L389 104" className={styles.openSwitch} />}
    <rect x="193" y="138" width="24" height="66" className={styles.resistorOne} />
    <rect x="353" y="138" width="24" height="66" className={styles.resistorTwo} />
    <text x="230" y="158" className={styles.labelOne}>R1</text>
    <text x="230" y="187">{format(settings.r1)} Ω</text>
    <text x="390" y="158" className={styles.labelTwo}>R2</text>
    <text x="390" y="187">{format(settings.r2)} Ω</text>
    <text x="205" y="295" textAnchor="middle">{format(result.resistors[0].current * 1000)} mA</text>
    <text x="365" y="295" textAnchor="middle">{format(result.resistors[1].current * 1000)} mA</text>
    <circle cx="125" cy="60" r="5" className={styles.node} />
    <circle cx="125" cy="260" r="5" className={styles.node} />
    <text x="125" y="39" textAnchor="middle" aria-label={`${t('node')} A`}>A</text>
    <text x="125" y="295" textAnchor="middle" aria-label={`${t('node')} B`}>B</text>
  </g>;
}

function SeriesCircuit({ settings, result, format }: Props) {
  return <g>
    <path d="M55 60H190 M260 60H300 M325 60H350 M420 60H455V260H55" className={styles.wire} />
    <path d={settings.connected ? 'M300 60H325' : 'M300 60L320 39'} className={settings.connected ? styles.wire : styles.openSwitch} />
    <rect x="190" y="48" width="70" height="24" className={styles.resistorOne} />
    <rect x="350" y="48" width="70" height="24" className={styles.resistorTwo} />
    <text x="225" y="108" textAnchor="middle" className={styles.labelOne}>R1</text>
    <text x="225" y="138" textAnchor="middle">{format(settings.r1)} Ω</text>
    <text x="225" y="168" textAnchor="middle">{format(result.resistors[0].voltage)} V</text>
    <text x="385" y="108" textAnchor="middle" className={styles.labelTwo}>R2</text>
    <text x="385" y="138" textAnchor="middle">{format(settings.r2)} Ω</text>
    <text x="385" y="168" textAnchor="middle">{format(result.resistors[1].voltage)} V</text>
  </g>;
}

function SingleCircuit({ settings, result, format }: Props) {
  return <g>
    <path d="M55 60H340V138 M340 204V260H55" className={styles.wire} />
    <rect x="328" y="138" width="24" height="66" className={styles.resistorOne} />
    <text x="365" y="145" className={styles.labelOne}>R1</text>
    <text x="365" y="176">{format(settings.r1)} Ω</text>
    <text x="365" y="207">{format(result.sourceVoltage)} V</text>
  </g>;
}

export function CircuitDiagram(props: Props) {
  const t = useTranslations('RadioBasics.lab');
  const arrowId = useId().replaceAll(':', '');
  const hasCurrent = props.result.current > 0;
  const description = !props.settings.powered ? 'sourceOff'
    : !props.settings.connected && props.settings.mode !== 'single'
      ? props.settings.mode === 'series' ? 'openSeries' : 'openParallel'
      : `${props.settings.mode}Why`;
  return <svg viewBox="0 0 500 315" className={styles.diagram} role="img" aria-labelledby={`${arrowId}-title ${arrowId}-desc`}>
    <title id={`${arrowId}-title`}>{t('diagramTitle')} · {t(props.settings.mode)}</title>
    <desc id={`${arrowId}-desc`}>{t(description)}</desc>
    <defs><marker id={arrowId} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="currentColor" /></marker></defs>
    <Source voltage={props.result.sourceVoltage} format={props.format} />
    {props.settings.mode === 'parallel' ? <ParallelCircuit {...props} /> : props.settings.mode === 'series' ? <SeriesCircuit {...props} /> : <SingleCircuit {...props} />}
    <text x="310" y="30" textAnchor="middle" className={styles.currentLabel}>I = {props.format(props.result.current * 1000)} mA</text>
    {hasCurrent && <g className={styles.currentArrow}>
      <path d="M100 60H154 M157 260H105" markerEnd={`url(#${arrowId})`} />
      {props.settings.mode === 'parallel' && <>
        <path d="M205 95V123" markerEnd={`url(#${arrowId})`} />
        {props.settings.connected && <path d="M365 95V123" markerEnd={`url(#${arrowId})`} />}
      </>}
    </g>}
  </svg>;
}
