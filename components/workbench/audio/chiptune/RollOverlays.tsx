import type { LoopRegion } from '@/lib/workbench/chiptune';
import { tickToX } from './grid';
import styles from './chiptune.module.css';

interface Props {
  range?: { startTick: number; endTick: number } | null;
  loop?: LoopRegion;
  stepW: number;
  height: number;
}

/** Sombras sobre la grilla: rango seleccionado y región de loop activa. */
export function RollOverlays({ range, loop, stepW, height }: Props) {
  return (
    <>
      {range && range.endTick > range.startTick && (
        <div
          className={styles.rollRange}
          style={{ left: tickToX(range.startTick, stepW), width: tickToX(range.endTick - range.startTick, stepW), height }}
        />
      )}
      {loop && (
        <div
          className={styles.rollLoop}
          style={{ left: tickToX(loop.start, stepW), width: tickToX(loop.end - loop.start, stepW), height }}
        />
      )}
    </>
  );
}
