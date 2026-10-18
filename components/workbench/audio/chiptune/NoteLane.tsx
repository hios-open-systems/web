'use client';

import { forwardRef, useRef, type PointerEvent as ReactPointerEvent } from 'react';
import { MAX_NOTE_OFFSET, clamp, type ChiptuneNote } from '@/lib/workbench/chiptune';
import { tickToX } from './grid';
import styles from './chiptune.module.css';

export type LaneKind = 'velocity' | 'pan' | 'offset';

export const LANE_H = 76;

interface Lane {
  label: string;
  top: string;
  bottom: string;
  bipolar: boolean;
  /** Valor de la nota normalizado a 0..1 (alto de la barra). */
  read: (note: ChiptuneNote) => number;
  /** y normalizado (0 arriba .. 1 abajo) -> patch de la nota. */
  write: (y: number) => Partial<ChiptuneNote>;
}

export const LANES: Record<LaneKind, Lane> = {
  velocity: {
    label: 'Intensidad',
    top: '127',
    bottom: '1',
    bipolar: false,
    read: (n) => n.velocity / 127,
    write: (y) => ({ velocity: clamp(Math.round((1 - y) * 126) + 1, 1, 127) }),
  },
  pan: {
    label: 'Paneo',
    top: 'Der',
    bottom: 'Izq',
    bipolar: true,
    read: (n) => ((n.pan ?? 0) + 1) / 2,
    write: (y) => ({ pan: Math.round((1 - 2 * y) * 20) / 20 }),
  },
  offset: {
    label: 'Retraso',
    top: 'Tarde',
    bottom: 'Antes',
    bipolar: true,
    read: (n) => ((n.offset ?? 0) / MAX_NOTE_OFFSET + 1) / 2,
    write: (y) => ({ offset: Math.round((1 - 2 * y) * MAX_NOTE_OFFSET) }),
  },
};

interface Props {
  kind: LaneKind;
  notes: ChiptuneNote[];
  selectedIds: string[];
  color: string;
  stepW: number;
  width: number;
  onChangeNotes: (ids: string[], patch: Partial<ChiptuneNote>) => void;
}

/**
 * Carril de automatización por nota (estilo DAW) debajo del piano roll: una barra
 * por nota de la pista activa. Arrastrar "pinta" el valor sobre las notas bajo el
 * puntero; si hay notas seleccionadas, solo esas se editan.
 */
export function NoteLane({ kind, notes, selectedIds, color, stepW, width, onChangeNotes }: Props) {
  const lane = LANES[kind];
  const painting = useRef(false);
  const selected = new Set(selectedIds);
  const editable = (note: ChiptuneNote) => selected.size === 0 || selected.has(note.id);

  const paint = (event: ReactPointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    // 4px de margen arriba/abajo para llegar fácil a los extremos (127, 100% izq/der).
    const y = clamp((event.clientY - rect.top - 4) / (LANE_H - 8), 0, 1);
    const hits = notes.filter((n) => editable(n) && Math.abs(tickToX(n.start, stepW) + stepW / 2 - x) <= stepW / 2);
    if (hits.length) onChangeNotes(hits.map((n) => n.id), lane.write(y));
  };

  return (
    <div
      className={styles.lane}
      style={{ width, height: LANE_H }}
      role="group"
      aria-label={`Carril de ${lane.label.toLowerCase()}`}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        painting.current = true;
        paint(event);
      }}
      onPointerMove={(event) => {
        if (painting.current) paint(event);
      }}
      onPointerUp={() => {
        painting.current = false;
      }}
      onPointerCancel={() => {
        painting.current = false;
      }}
    >
      {lane.bipolar && <div className={styles.laneCenter} />}
      {notes.map((note) => {
        const value = lane.read(note);
        const top = lane.bipolar ? Math.min(value, 0.5) : value;
        const height = lane.bipolar ? Math.abs(value - 0.5) : value;
        return (
          <div
            key={note.id}
            className={styles.laneBar}
            style={{
              left: tickToX(note.start, stepW) + stepW / 2 - 3,
              top: lane.bipolar ? `${(1 - top - height) * 100}%` : undefined,
              bottom: lane.bipolar ? undefined : 0,
              height: `${Math.max(height * 100, 2)}%`,
              background: color,
              opacity: editable(note) ? 1 : 0.3,
            }}
          />
        );
      })}
    </div>
  );
}

/** Carril con su etiqueta fija; el roll sincroniza el scroll horizontal vía ref. */
export const NoteLaneStrip = forwardRef<HTMLDivElement, Props & { onScrollX: (left: number) => void }>(function NoteLaneStrip(
  { onScrollX, ...props },
  ref,
) {
  const lane = LANES[props.kind];
  return (
    <div className={styles.laneScroll} ref={ref} onScroll={(event) => onScrollX(event.currentTarget.scrollLeft)}>
      <div className={styles.laneLabel}>
        <span>{lane.top}</span>
        <strong>{lane.label}</strong>
        <span>{lane.bottom}</span>
      </div>
      <NoteLane {...props} />
    </div>
  );
});
