'use client';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { LabSignal } from './LabSignal';
import styles from './labShowcase.module.css';

const Pinout = dynamic(() => import('./LabPinout'));
const Beat = dynamic(() => import('./LabBeat'));
const Qpsk = dynamic(() => import('./LabQpsk'));
const demos = ['signal', 'pinout', 'beat', 'qpsk'] as const;

export function LabShowcase() {
  const t = useTranslations('Landing.demos');
  const [active, setActive] = useState(0);
  // Stable server HTML; choose once after hydration, never interrupt an interaction.
  useEffect(() => { setActive(Math.floor(Math.random() * demos.length)); }, []);
  return <div className={styles.showcase}>
    <div className={styles.selector} role="group" aria-label={t('choose')}>
      {demos.map((demo, index) => <button key={demo} type="button"
        aria-pressed={active === index} onClick={() => setActive(index)}>{t(demo)}</button>)}
    </div>
    <div className={styles.stage} data-demo={demos[active]}>
      {active === 0 ? <LabSignal /> : active === 1 ? <Pinout /> : active === 2 ? <Beat /> : <Qpsk />}
    </div>
  </div>;
}
