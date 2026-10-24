'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { carrierSample, GRAY_ORDER, mapDibit } from '@/components/dsp/QpskSimulator/qpskMath';
import type { Dibit } from '@/components/dsp/QpskSimulator/types';
import { LabFrame } from './LabFrame';
import styles from './labShowcase.module.css';

export default function LabQpsk() {
  const t = useTranslations('Landing.demos');
  const [bits, setBits] = useState<Dibit>('00');
  const symbol = mapDibit(bits);
  const wave = Array.from({ length: 181 }, (_, x) =>
    `${x ? 'L' : 'M'}${x * 2},${55 - 38 * carrierSample(bits, x / 180 * Math.PI * 8)}`).join(' ');
  return <LabFrame code="IQ—03" title={t('qpskTitle')} hint={t('qpskHint')} href="/workbench/qpsk-modulator">
    <svg className={styles.constellation} viewBox="0 0 360 180" role="img" aria-label={t('qpskTitle')}>
      <path d="M180 10V170 M100 90H260" stroke="currentColor" opacity=".35" />
      <text x="265" y="95" fill="currentColor">I</text><text x="185" y="16" fill="currentColor">Q</text>
      {GRAY_ORDER.map(dibit => { const p = mapDibit(dibit); return <g key={dibit}>
        <circle cx={180 + p.I * 52} cy={90 - p.Q * 52} r={dibit === bits ? 9 : 4} fill={dibit === bits ? '#e6a2ff' : '#83caff'} />
        <text x={180 + p.I * 52 - 9} y={90 - p.Q * 52 + 25} fill="currentColor">{dibit}</text>
      </g>; })}
      <path d={`M180 90L${180 + symbol.I * 52} ${90 - symbol.Q * 52}`} stroke="#e6a2ff" strokeWidth="2" />
    </svg>
    <div className={styles.selector} role="group" aria-label={t('symbol')}>
      {GRAY_ORDER.map(dibit => <button key={dibit} aria-pressed={bits === dibit} onClick={() => setBits(dibit)}>{dibit}</button>)}
    </div>
    <svg viewBox="0 0 360 110" className={styles.carrier} role="img" aria-label={t('carrier')}>
      <path d={wave} fill="none" stroke="#d5fa84" strokeWidth="2" />
    </svg>
    <div className={styles.values}>I {symbol.I > 0 ? '+1' : '−1'} · Q {symbol.Q > 0 ? '+1' : '−1'} · φ {symbol.phaseDeg}°</div>
  </LabFrame>;
}
