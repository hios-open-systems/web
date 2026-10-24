'use client';
import { useState, type Dispatch, type SetStateAction } from 'react';
import { useTranslations } from 'next-intl';
import { TICKS_PER_STEP, type ChiptuneSong } from '@/lib/workbench/chiptune';
import { toggleBeatStep, toggleMelodyStep } from '@/lib/workbench/landingBeat';
import styles from './labShowcase.module.css';

export function LabBeatGrid({ song, setSong }: { song: ChiptuneSong; setSong: Dispatch<SetStateAction<ChiptuneSong>> }) {
  const t = useTranslations('Landing.demos');
  const [bar, setBar] = useState(0);
  const steps = Array.from({ length: 16 }, (_, step) => step + bar * 16);
  const keys = song.tracks.find(track => track.id === 'Keys')!;
  return <div className={styles.roll} role="group" aria-label={t('beatTitle', { bpm: song.bpm })}>
    <div className={styles.bars} role="group" aria-label={t('bar')}>
      {[0, 1].map(value => <button key={value} aria-pressed={bar === value} onClick={() => setBar(value)}>{t('bar')} {value + 1}</button>)}
    </div>
    {song.tracks.filter(track => track.id !== 'Keys').map(track => <div key={track.id} className={styles.lane}>
      <span>{track.name}</span><div>{steps.map(step => <button key={step} type="button"
        aria-label={`${track.name} · ${step + 1}`} aria-pressed={track.notes.some(note => note.start === step * TICKS_PER_STEP)}
        onClick={() => setSong(current => toggleBeatStep(current, track.id, step))} />)}</div>
    </div>)}
    {[76, 72, 69, 67].map((pitch, row) => <div key={pitch} className={`${styles.lane} ${styles.pianoLane}`}>
      <span>{['E5', 'C5', 'A4', 'G4'][row]}</span><div>{steps.map(step => <button key={step} type="button"
        aria-label={`Keys ${['E5', 'C5', 'A4', 'G4'][row]} · ${step + 1}`}
        aria-pressed={keys.notes.some(note => note.pitch === pitch && note.start === step * TICKS_PER_STEP)}
        onClick={() => setSong(current => toggleMelodyStep(current, pitch, step))} />)}</div>
    </div>)}
  </div>;
}
