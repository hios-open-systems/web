'use client';
import { useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { TICKS_PER_STEP, clamp, noteOnset, type ChiptuneNote } from '@/lib/workbench/chiptune';
import { NOTE_NAMES } from '@/lib/workbench/noteFreq';
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

export function PianoRollNote({
  note,
  color,
  selected,
  stepW = STEP_W,
  rowH = ROW_H,
  onSelect,
  onChange,
  onDelete,
}: Props) {
  const drag = useRef<DragState | null>(null);
  const move = (event: ReactPointerEvent) => {
    const d = drag.current;
    if (!d) return;
    if (d.mode === 'move') {
      const step = Math.max(0, Math.round((tickToX(d.start, stepW) + event.clientX - d.x) / stepW));
      onChange(note.id, {
        start: step * TICKS_PER_STEP,
        pitch: clamp(d.pitch - Math.round((event.clientY - d.y) / rowH), PITCH_MIN, PITCH_MAX),
      });
    } else {
      const steps = Math.max(1, Math.round((durToWidth(d.duration, stepW) + event.clientX - d.x) / stepW));
      onChange(note.id, { duration: steps * TICKS_PER_STEP });
    }
  };
  const begin = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.stopPropagation();
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const mode = (event.target as HTMLElement).dataset.resize ? 'resize' : 'move';
    onSelect(note.id);
    drag.current = {
      mode,
      x: event.clientX,
      y: event.clientY,
      start: note.start,
      pitch: note.pitch,
      duration: note.duration,
    };
  };
  const label = `${NOTE_NAMES[note.pitch % 12]}${Math.floor(note.pitch / 12) - 1}`;
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Nota ${label}`}
      aria-pressed={selected}
      className={`${styles.note} ${selected ? styles.noteSelected : ''}`}
      style={{
        // Se dibuja donde suena (con micro-timing); el drag sigue ajustando a la grilla.
        left: tickToX(noteOnset(note), stepW),
        top: pitchToY(note.pitch, rowH),
        width: Math.max(stepW - 2, durToWidth(note.duration, stepW) - 2),
        height: rowH - 2,
        background: color,
        opacity: 0.4 + (0.6 * note.velocity) / 127,
      }}
      onPointerDown={begin}
      onPointerMove={move}
      onPointerUp={(event) => {
        event.stopPropagation();
        drag.current = null;
      }}
      onPointerCancel={() => {
        drag.current = null;
      }}
      onLostPointerCapture={() => {
        drag.current = null;
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          event.stopPropagation();
          onSelect(note.id);
        }
      }}
      onContextMenu={(event) => {
        event.preventDefault();
        onDelete(note.id);
      }}
    >
      <span className={styles.noteCaption}>{label}</span>
      <span className={styles.noteResize} data-resize="true" />
    </div>
  );
}
