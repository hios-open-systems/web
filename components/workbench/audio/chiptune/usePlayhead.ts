import { useEffect, useRef } from 'react';
import { tickToX } from './grid';
export function usePlayhead(getPlayheadTicks: () => number | null, stepW: number) {
  const playheadRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = playheadRef.current;
    let raf = 0;
    const tick = () => {
      const ticks = getPlayheadTicks();
      if (element && ticks != null) {
        element.style.opacity = '1';
        element.style.transform = `translateX(${tickToX(ticks, stepW)}px)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [getPlayheadTicks, stepW]);

  return playheadRef;
}
