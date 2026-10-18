'use client';
import { Slider } from 'antd';
import { MAX_NOTE_OFFSET, type ChiptuneNote } from '@/lib/workbench/chiptune';

const panLabel = (pan: number): string =>
  pan === 0 ? 'Centro' : `${Math.round(Math.abs(pan) * 100)}% ${pan < 0 ? 'izq' : 'der'}`;
const offsetLabel = (ticks: number): string =>
  ticks === 0 ? 'En la grilla' : `${ticks > 0 ? '+' : ''}${ticks} ticks (${ticks > 0 ? 'tarde' : 'antes'})`;

interface Props {
  note: ChiptuneNote;
  onChange: (patch: Partial<ChiptuneNote>) => void;
}

/** Intensidad, paneo y micro-timing de una nota (o de la selección, tomando la primera como referencia). */
export function NoteFeel({ note, onChange }: Props) {
  const pan = note.pan ?? 0;
  const offset = note.offset ?? 0;
  return (
    <>
      <label>
        Intensidad · {note.velocity}
        <Slider ariaLabelForHandle="Intensidad de nota" min={1} max={127} value={note.velocity} onChange={(v) => onChange({ velocity: v })} />
      </label>
      <label>
        Paneo · {panLabel(pan)}
        <Slider
          ariaLabelForHandle="Paneo de nota"
          min={-1}
          max={1}
          step={0.05}
          value={pan}
          marks={{ 0: '' }}
          tooltip={{ formatter: (v) => panLabel(v ?? 0) }}
          onChange={(v) => onChange({ pan: v })}
        />
      </label>
      <label>
        Retraso · {offsetLabel(offset)}
        <Slider
          ariaLabelForHandle="Retraso de nota"
          min={-MAX_NOTE_OFFSET}
          max={MAX_NOTE_OFFSET}
          step={5}
          value={offset}
          marks={{ 0: '' }}
          tooltip={{ formatter: (v) => offsetLabel(v ?? 0) }}
          onChange={(v) => onChange({ offset: v })}
        />
      </label>
    </>
  );
}
