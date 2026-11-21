'use client';

import { useSyncExternalStore } from 'react';
import { defaultSound, getSound, setSound, subscribeSound } from './morseSound';
import styles from '../morsePractice.module.css';

export function MorseSoundControls() {
  const { tone, noise } = useSyncExternalStore(subscribeSound, getSound, defaultSound);
  return (
    <fieldset className={styles.sound}>
      <legend>Sonido Morse</legend>
      <div className={styles.settings}>
        <label>Tono · {tone} Hz<input type="range" min={400} max={1000} step={10} value={tone}
          aria-valuetext={tone + ' Hz'} onChange={e => setSound({ tone: Number(e.target.value) })} /></label>
        <label>Fondo de recepción<select value={noise} onChange={e => setSound({ noise: Number(e.target.value) })}>
          <option value={0}>Limpio</option><option value={1}>Ruido suave</option>
          <option value={2}>Ruido medio</option><option value={3}>Ruido intenso</option>
        </select></label>
      </div>
      <button type="button" disabled={tone === 650 && !noise}
        onClick={() => setSound(defaultSound())}>Restablecer sonido original</button>
    </fieldset>
  );
}
