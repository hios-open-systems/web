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

export function PianoRollNote({ note, color, selected, onSelect, onChange, onDelete }: Props) {
  const drag = useRef<DragState | null>(null);

  const onPointerMove = (event: globalThis.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    if (d.mode === 'move') {
      const step = Math.max(0, Math.round((tickToX(d.start) + (event.clientX - d.x)) / STEP_W));
      const pitch = clamp(d.pitch - Math.round((event.clientY - d.y) / ROW_H), PITCH_MIN, PITCH_MAX);
      onChange(note.id, { start: step * TICKS_PER_STEP, pitch });
    } else {
      const steps = Math.max(1, Math.round((durToWidth(d.duration) + (event.clientX - d.x)) / STEP_W));
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
        left: tickToX(note.start),
        top: pitchToY(note.pitch),
        width: Math.max(STEP_W - 2, durToWidth(note.duration) - 2),
        height: ROW_H - 2,
        background: color,
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
