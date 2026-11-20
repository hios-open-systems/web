'use client';

import { useTranslations } from 'next-intl';
import styles from './radioBasics.module.css';

export function MeterDiagram({ kind }: { kind: 'voltage' | 'current' }) {
  const t = useTranslations('RadioBasics.power');
  const voltage = kind === 'voltage';
  const label = t(voltage ? 'voltmeterTitle' : 'ammeterTitle');
  return (
    <svg viewBox="0 0 310 200" role="img" aria-label={label} className={styles.meter}>
      <title>{label}</title>
      <g fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d={voltage ? 'M40 91 V35 H185 V65 M185 115 V160 H40 V109' : 'M40 91 V35 H87 M133 35 H185 V65 M185 115 V160 H40 V109'} />
        <line x1="23" y1="91" x2="57" y2="91" />
        <line x1="30" y1="109" x2="50" y2="109" />
        <rect x="173" y="65" width="24" height="50" rx="2" />
        {voltage ? (
          <path d="M185 48 H265 V77 M265 123 V140 H185" className={styles.meterAccent} />
        ) : (
          <circle cx="110" cy="35" r="23" className={styles.meterFace} />
        )}
        {voltage ? <circle cx="265" cy="100" r="23" className={styles.meterFace} /> : null}
      </g>
      <g className={styles.meterText} textAnchor="middle">
        <text x="72" y="88">+</text><text x="72" y="120">−</text>
        <text x="148" y="98">R</text>
        <text x={voltage ? 265 : 110} y={voltage ? 106 : 41}>{voltage ? 'V' : 'A'}</text>
      </g>
      {voltage ? <g className={styles.meterNodes}><circle cx="185" cy="48" r="4" /><circle cx="185" cy="140" r="4" /></g> : null}
    </svg>
  );
}
