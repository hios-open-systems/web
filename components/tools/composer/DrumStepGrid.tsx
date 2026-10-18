'use client';
import { useMemo } from 'react';
import { formatDrumPitch } from '@/lib/workbench/drumMap';
import { cycleAccent, drumRows, indexHits, toggleHit } from '@/lib/workbench/drumGrid';
import { INSTRUMENTS, type ChiptuneNote, type ChiptuneTrack } from '@/lib/workbench/chiptune';
import { usePlayhead } from '@/components/workbench/audio/chiptune/usePlayhead';
import styles from './drumGrid.module.css';

const CELL_W = 26;

interface Props {
  track: ChiptuneTrack;
  steps: number;
  stepsPerBar: number;
  getPlayheadTicks: () => number | null;
  onNotes: (notes: ChiptuneNote[]) => void;
  onPreview: (pitch: number) => void;
}

/**
 * Vista de batería por instrumento (estilo caja de ritmos): una fila por golpe,
 * una columna por 16avo. Clic prende/apaga; clic derecho cicla acento/ghost.
 */
export function DrumStepGrid({ track, steps, stepsPerBar, getPlayheadTicks, onNotes, onPreview }: Props) {
  const rows = useMemo(() => drumRows(track.notes), [track.notes]);
  const hits = useMemo(() => indexHits(track.notes), [track.notes]);
  const playheadRef = usePlayhead(getPlayheadTicks, CELL_W);
  const color = INSTRUMENTS[track.instrument].color;

  return (
    <div className={styles.wrap} role="group" aria-label="Grilla de batería">
      <div className={styles.inner} style={{ width: 110 + steps * CELL_W }}>
        {rows.map((pitch) => (
          <div key={pitch} className={styles.row}>
            <button type="button" className={styles.label} onClick={() => onPreview(pitch)} title="Escuchar">
              {formatDrumPitch(pitch)}
            </button>
            {Array.from({ length: steps }, (_, step) => {
              const notes = hits.get(`${pitch}:${step}`);
              const velocity = notes ? Math.max(...notes.map((n) => n.velocity)) : 0;
              return (
                <button
                  key={step}
                  type="button"
                  aria-pressed={!!notes}
                  aria-label={`${formatDrumPitch(pitch)} paso ${step + 1}`}
                  className={`${styles.cell} ${step % stepsPerBar === 0 ? styles.bar : step % 4 === 0 ? styles.beat : ''}`}
                  onClick={() => {
                    onNotes(toggleHit(track.notes, pitch, step));
                    if (!notes) onPreview(pitch);
                  }}
                  onContextMenu={(event) => {
                    event.preventDefault();
                    if (notes) onNotes(cycleAccent(track.notes, pitch, step));
                  }}
                >
                  {notes && <span className={styles.hit} style={{ background: color, opacity: 0.35 + (0.65 * velocity) / 127 }} />}
                </button>
              );
            })}
          </div>
        ))}
        <div ref={playheadRef} className={styles.playhead} style={{ height: rows.length * 28 }} />
      </div>
    </div>
  );
}
