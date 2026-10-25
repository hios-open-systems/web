'use client';
import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { usePlayback } from '@/components/workbench/audio/chiptune/usePlayback';
import { landingBeat, randomizeLandingBeat } from '@/lib/workbench/landingBeat';
import { createHandoff } from '@/lib/workbench/handoff';
import { serializeSong, TICKS_PER_STEP } from '@/lib/workbench/chiptune';
import { LabBeatGrid } from './LabBeatGrid';
import styles from './labShowcase.module.css';

export default function LabBeat() {
  const t = useTranslations('Landing.demos');
  const q = useTranslations('Qpsk');
  const locale = useLocale();
  const router = useRouter();
  const [song, setSong] = useState(landingBeat);
  const [error, setError] = useState(false);
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const player = usePlayback(song);
  const { stop, isPlaying, getPlayheadTicks } = player;
  useEffect(() => {
    const hidden = () => { if (document.hidden) stop(); };
    document.addEventListener('visibilitychange', hidden);
    return () => document.removeEventListener('visibilitychange', hidden);
  }, [stop]);
  useEffect(() => {
    if (!isPlaying) {
      setActiveStep(null);
      return;
    }
    const id = window.setInterval(() => {
      const tick = getPlayheadTicks();
      setActiveStep(tick === null ? null : Math.floor(tick / TICKS_PER_STEP) % 32);
    }, 50);
    return () => window.clearInterval(id);
  }, [isPlaying, getPlayheadTicks]);
  const open = () => {
    try {
      const id = createHandoff('chiptune', { song: serializeSong(song) });
      player.stop();
      router.push(`/${locale}/composer?handoff=${id}`);
    } catch { setError(true); }
  };
  return <div className={styles.instrument}>
    <div className={styles.rail}><span>HI / BEAT—04</span><span>{t('local')}</span></div>
    <h2>{t('beatTitle', { bpm: song.bpm })}</h2>
    <p className={styles.caption}>{t('beatHint')}</p>
    <LabBeatGrid song={song} setSong={setSong} activeStep={activeStep} />
    <div className={styles.transport}>
      <div className={styles.transportButtons}>
        <button type="button" onClick={() => player.isPlaying ? player.stop() : void player.play()}>
          {player.isPlaying ? t('stop') : t('play')}
        </button>
        <button
          type="button"
          className={styles.secondaryBtn}
          onClick={() => setSong(current => randomizeLandingBeat(current))}
          aria-label={q('random')}
        >
          🎲 {q('random')}
        </button>
      </div>
      <label>BPM <input aria-label="BPM" type="number" min="80" max="180" value={song.bpm}
        onChange={event => setSong(current => ({ ...current, bpm: Math.min(180, Math.max(80, Number(event.target.value))) }))} /></label>
    </div>
    {player.playbackError || error ? <p role="alert">{t('error')}</p> : null}
    <div className={styles.footer}><span>{t('audioHint')}</span><button onClick={open}>{t('continueBeat')} ↗</button></div>
  </div>;
}
