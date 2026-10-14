import { inScale, type MusicalScale } from '@/lib/workbench/chiptuneMusic';
import { PITCH_COUNT, PITCH_MAX, pitchToY } from './grid';
import styles from './chiptune.module.css';

export function ScaleRows({ scale, rowH }: { scale: MusicalScale; rowH: number }) {
  return (
    <div aria-hidden="true" className={styles.scaleRows}>
      {Array.from({ length: PITCH_COUNT }, (_, i) => PITCH_MAX - i)
        .filter((pitch) => inScale(pitch, scale))
        .map((pitch) => (
          <div
            key={pitch}
            data-scale-pitch={pitch}
            className={pitch % 12 === scale.root ? styles.scaleRoot : styles.scaleRow}
            style={{ top: pitchToY(pitch, rowH), height: rowH }}
          />
        ))}
    </div>
  );
}
