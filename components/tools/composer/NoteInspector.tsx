'use client';
import { Button, InputNumber, Select } from 'antd';
import { NOTE_NAMES } from '@/lib/workbench/noteFreq';
import { TICKS_PER_STEP, type ChiptuneNote } from '@/lib/workbench/chiptune';
import type { ComposerState } from './useComposerState';
import { NoteFeel } from './NoteFeel';
import styles from './composer.module.css';

export const NOTE_LENGTHS = [
  { value: 120, label: '1/16 · Semicorchea' },
  { value: 240, label: '1/8 · Corchea' },
  { value: 480, label: '1/4 · Negra' },
  { value: 960, label: '1/2 · Blanca' },
  { value: 1920, label: '1 · Redonda' },
];

function DurationSelect({ note, ppq, onChange }: { note: ChiptuneNote; ppq: number; onChange: (v: number) => void }) {
  const known = NOTE_LENGTHS.some((n) => n.value === note.duration);
  return (
    <Select
      aria-label="Duración de nota"
      value={note.duration}
      onChange={onChange}
      options={known ? NOTE_LENGTHS : [...NOTE_LENGTHS, { value: note.duration, label: `${+(note.duration / ppq).toFixed(2)} pulsos` }]}
    />
  );
}

export function NoteInspector({ c }: { c: ComposerState }) {
  const notes = c.song.tracks.find((t) => t.id === c.activeTrackId)?.notes ?? [];
  const selected = notes.filter((n) => c.selectedNoteIds.includes(n.id));
  const note = selected[0];
  if (!note)
    return (
      <p className={styles.hint}>
        Tocá una nota para editar tono, duración, intensidad, paneo y retraso. Con «Seleccionar rango» editás
        varias a la vez.
      </p>
    );
  const many = selected.length > 1;
  const change = (patch: Partial<ChiptuneNote>) => c.onChangeNotes(c.selectedNoteIds, patch);
  return (
    <div className={styles.inspector}>
      {many && (
        <p className={styles.hint} style={{ margin: '0 0 8px' }}>
          {selected.length} notas seleccionadas: los cambios se aplican a todas.
        </p>
      )}
      <div className={styles.fields}>
        {!many && (
          <label>
            Nota
            <Select
              aria-label="Nota seleccionada"
              value={note.pitch}
              onChange={(v) => change({ pitch: v })}
              options={Array.from({ length: 128 }, (_, value) => ({
                value,
                label: `${NOTE_NAMES[value % 12]}${Math.floor(value / 12) - 1}`,
              }))}
            />
          </label>
        )}
        {!many && (
          <label>
            Inicio (pasos de 1/16)
            <InputNumber
              aria-label="Inicio de nota"
              min={1}
              precision={0}
              value={note.start / TICKS_PER_STEP + 1}
              onChange={(v) => {
                if (v !== null) change({ start: (v - 1) * TICKS_PER_STEP });
              }}
            />
          </label>
        )}
        <label>
          Duración
          <DurationSelect note={note} ppq={c.song.ppq} onChange={(duration) => change({ duration })} />
        </label>
        <NoteFeel note={note} onChange={change} />
      </div>
      <div className={styles.actions}>
        {!many && <Button onClick={c.duplicateNote}>Duplicar nota</Button>}
        <Button danger onClick={() => c.onDeleteNotes(c.selectedNoteIds)}>
          {many ? `Eliminar ${selected.length} notas` : 'Eliminar nota'}
        </Button>
      </div>
    </div>
  );
}
