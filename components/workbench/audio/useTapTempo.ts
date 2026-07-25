'use client';

import { useCallback, useRef } from 'react';

/**
 * Tap-tempo compartido: promedia los intervalos entre taps (ventana de 2 s) y
 * llama onBpm con el BPM resultante (clampeado). Reusable por el TransportBar del
 * composer, el BeatCounter y cualquier futura herramienta rítmica.
 */
export function useTapTempo(onBpm: (bpm: number) => void, min = 40, max = 300): () => void {
  const taps = useRef<number[]>([]);
  return useCallback(() => {
    const now = performance.now();
    const arr = taps.current.filter((t) => now - t < 2000);
    arr.push(now);
    taps.current = arr;
    if (arr.length >= 2) {
      const intervals = arr.slice(1).map((t, i) => t - arr[i]);
      const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      onBpm(Math.max(min, Math.min(max, Math.round(60000 / avg))));
    }
  }, [onBpm, min, max]);
}
