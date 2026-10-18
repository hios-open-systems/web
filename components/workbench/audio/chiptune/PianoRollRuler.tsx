'use client';

import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { TICKS_PER_STEP, type LoopRegion } from '@/lib/workbench/chiptune';
import { RULER_H, tickToX } from './grid';
import styles from './chiptune.module.css';

interface Props {
  width: number;
  stepW: number;
  bars: number;
  barWidth: number;
  ppq: number;
  songTicks: number;
  loopRegion?: LoopRegion;
  loopActive: boolean;
  onSeek?: (tick: number) => void;
  onLoopRegion?: (region: LoopRegion | null) => void;
}

/**
 * Regla de compases. Tocar = escuchar desde ahí. Arrastrar = marcar la región de
 * loop (ajusta a pulsos), como el "cycle" de un DAW. Doble clic la quita.
 */
export function PianoRollRuler({ width, stepW, bars, barWidth, ppq, songTicks, loopRegion, loopActive, onSeek, onLoopRegion }: Props) {
  const down = useRef<{ x: number; left: number } | null>(null);
  const [draft, setDraft] = useState<LoopRegion | null>(null);

  const toBeat = (x: number, round: (n: number) => number) =>
    Math.max(0, Math.min(songTicks, round(((x / stepW) * TICKS_PER_STEP) / ppq) * ppq));
  const regionFrom = (a: number, b: number): LoopRegion => {
    const start = toBeat(Math.min(a, b), Math.floor);
    return { start, end: Math.max(start + ppq, toBeat(Math.max(a, b), Math.ceil)) };
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    down.current = { x: event.clientX, left: event.currentTarget.getBoundingClientRect().left };
  };
  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const d = down.current;
    if (!d || !onLoopRegion || Math.abs(event.clientX - d.x) <= 6) return;
    setDraft(regionFrom(d.x - d.left, event.clientX - d.left));
  };
  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const d = down.current;
    down.current = null;
    setDraft(null);
    if (!d) return;
    if (onLoopRegion && Math.abs(event.clientX - d.x) > 6) {
      onLoopRegion(regionFrom(d.x - d.left, event.clientX - d.left));
    } else {
      onSeek?.(Math.max(0, ((event.clientX - d.left) / stepW) * TICKS_PER_STEP));
    }
  };

  const shown = draft ?? loopRegion;
  return (
    <div
      className={styles.rollRuler}
      style={{ width, height: RULER_H, touchAction: 'none' }}
      title="Tocá para escuchar desde ahí. Arrastrá para marcar el loop. Doble clic lo quita."
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        down.current = null;
        setDraft(null);
      }}
      onDoubleClick={() => onLoopRegion?.(null)}
    >
      {shown && (
        <div
          className={`${styles.rulerLoop} ${loopActive || draft ? '' : styles.rulerLoopOff}`}
          style={{ left: tickToX(shown.start, stepW), width: tickToX(shown.end - shown.start, stepW) }}
          aria-label="Región de loop"
        />
      )}
      {Array.from({ length: bars }, (_, i) => (
        <span key={i} className={styles.rollBar} style={{ left: i * barWidth, width: barWidth }}>
          {i + 1}
        </span>
      ))}
    </div>
  );
}
