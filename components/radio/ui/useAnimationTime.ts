'use client';

import { useEffect, useState } from 'react';

/**
 * Tiempo en segundos que avanza con requestAnimationFrame mientras `running`.
 * Respeta prefers-reduced-motion: en ese caso queda quieto.
 */
export function useAnimationTime(running = true): number {
  const [t, setT] = useState(0);
  useEffect(() => {
    if (!running) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      setT((prev) => prev + dt);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running]);
  return t;
}

/** Convierte una lista de puntos en un path SVG. */
export function toPath(points: ReadonlyArray<readonly [number, number]>): string {
  return points.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join('');
}
