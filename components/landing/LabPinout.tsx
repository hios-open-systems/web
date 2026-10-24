'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { AUDIO_BREAKOUTS } from '@/config/pinouts/modules/audio';
import { LabFrame } from './LabFrame';
import styles from './labShowcase.module.css';

const board = AUDIO_BREAKOUTS.find(module => module.id === 'max98357a')!;
export default function LabPinout() {
  const t = useTranslations('Landing.demos');
  const [selected, setSelected] = useState(board.pins[0]);
  return <LabFrame code="PIN—02" title={board.name} hint={t('pinHint')} href="/pinouts#max98357a">
    <div className={styles.board}>
      <div className={styles.pins}>{board.pins.map(pin => <button type="button" key={pin.name}
        aria-pressed={selected.name === pin.name} onClick={() => setSelected(pin)}>
        <i aria-hidden />{pin.name}<small>{pin.role.toUpperCase()}</small>
      </button>)}</div>
      <div className={styles.chip}><span>I²S</span><strong>MAX<br />98357A</strong><span>CLASS D</span></div>
    </div>
    <div className={styles.readout} aria-live="polite"><strong>{selected.name}</strong>
      <p>{t(`pins.${selected.name === 'SPK−' ? 'SPKminus' : selected.name === 'SPK+' ? 'SPKplus' : selected.name}`)}</p>
    </div>
  </LabFrame>;
}
