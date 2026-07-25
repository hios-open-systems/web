'use client';

import { useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { TICKS_PER_STEP, clamp, type ChiptuneNote } from '@/lib/workbench/chiptune';
import { ROW_H, STEP_W, PITCH_MIN, PITCH_MAX, pitchToY, tickToX, durToWidth } from './grid';
import styles from './chiptune.module.css';

interface Props {
  note: ChiptuneNote;
  color: string;
  selected: boolean;
  stepW?: number;
  rowH?: number;
  onSelect: (id: string) => void;
  onChange: (id: string, patch: Partial<ChiptuneNote>) => void;
  onDelete: (id: string) => void;
}

interface DragState {
  mode: 'move' | 'resize';
  x: number;
  y: number;
  start: number;
  pitch: number;
  duration: number;
}

export function PianoRollNote({ note, color, selected, stepW = STEP_W, rowH = ROW_H, onSelect, onChange, onDelete }: Props) {
  const drag = useRef<DragState | null>(null);

  const onPointerMove = (event: globalThis.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    if (d.mode === 'move') {
      const step = Math.max(0, Math.round((tickToX(d.start, stepW) + (event.clientX - d.x)) / stepW));
      const pitch = clamp(d.pitch - Math.round((event.clientY - d.y) / rowH), PITCH_MIN, PITCH_MAX);
      onChange(note.id, { start: step * TICKS_PER_STEP, pitch });
    } else {
      const steps = Math.max(1, Math.round((durToWidth(d.duration, stepW) + (event.clientX - d.x)) / stepW));
      onChange(note.id, { duration: steps * TICKS_PER_STEP });
    }
  };

  const end = () => {
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', end);
    drag.current = null;
  };

  const begin = (mode: 'move' | 'resize') => (event: ReactPointerEvent) => {
    event.stopPropagation();
    onSelect(note.id);
    drag.current = { mode, x: event.clientX, y: event.clientY, start: note.start, pitch: note.pitch, duration: note.duration };
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', end);
  };

  return (
    <div
      className={`${styles.note} ${selected ? styles.noteSelected : ''}`}
      style={{
        left: tickToX(note.start, stepW),
        top: pitchToY(note.pitch, rowH),
        width: Math.max(stepW - 2, durToWidth(note.duration, stepW) - 2),
        height: rowH - 2,
        background: color,
        // velocity visible: notas suaves más translúcidas
        opacity: 0.4 + 0.6 * (note.velocity / 127),
      }}
      onPointerDown={begin('move')}
      onContextMenu={(event) => {
        event.preventDefault();
        onDelete(note.id);
      }}
    >
      <span className={styles.noteResize} onPointerDown={begin('resize')} />
    </div>
  );
}
