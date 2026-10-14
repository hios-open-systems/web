'use client';
import { Button, InputNumber, Select, Slider } from 'antd';
import { NOTE_NAMES } from '@/lib/workbench/noteFreq';
import { TICKS_PER_STEP } from '@/lib/workbench/chiptune';
import type { ComposerState } from './useComposerState';
import styles from './composer.module.css';

export const NOTE_LENGTHS = [
  { value: 120, label: '1/16 · Semicorchea' },
  { value: 240, label: '1/8 · Corchea' },
  { value: 480, label: '1/4 · Negra' },
  { value: 960, label: '1/2 · Blanca' },
  { value: 1920, label: '1 · Redonda' },
];
export function NoteInspector({ c }: { c: ComposerState }) {
  const note = c.song.tracks
    .find((t) => t.id === c.activeTrackId)
    ?.notes.find((n) => n.id === c.selectedNoteId);
  if (!note)
    return (
      <p className={styles.hint}>
        Tocá una nota para cambiar su tono, duración o intensidad. Arrastrá el borde derecho para alargarla.
      </p>
    );
  const change = (key: 'pitch' | 'start' | 'duration' | 'velocity', value: number | null) => {
    if (value !== null) c.onChangeNote(note.id, { [key]: value });
  };
  return (
    <div className={styles.inspector}>
      <div className={styles.fields}>
        <label>
          Nota
          <Select
            aria-label="Nota seleccionada"
            value={note.pitch}
            onChange={(v) => change('pitch', v)}
            options={Array.from({ length: 128 }, (_, value) => ({
              value,
              label: `${NOTE_NAMES[value % 12]}${Math.floor(value / 12) - 1}`,
            }))}
          />
        </label>
        <label>
          Inicio (pasos de 1/16)
          <InputNumber
            aria-label="Inicio de nota"
            min={1}
            precision={0}
            value={note.start / TICKS_PER_STEP + 1}
            onChange={(v) => {
              if (v !== null) change('start', (v - 1) * TICKS_PER_STEP);
            }}
          />
        </label>
        <label>
          Duración
          <Select
            aria-label="Duración de nota"
            value={note.duration}
            onChange={(v) => change('duration', v)}
            options={
              NOTE_LENGTHS.some((n) => n.value === note.duration)
                ? NOTE_LENGTHS
                : [
                    ...NOTE_LENGTHS,
                    { value: note.duration, label: `${+(note.duration / c.song.ppq).toFixed(2)} pulsos` },
                  ]
            }
          />
        </label>
        <label>
          Intensidad
          <Slider
            aria-label="Intensidad de nota"
            min={1}
            max={127}
            value={note.velocity}
            onChange={(v) => change('velocity', v)}
          />
        </label>
      </div>
      <div className={styles.actions}>
        <Button onClick={c.duplicateNote}>Duplicar nota</Button>
        <Button
          danger
          onClick={() => {
            c.onDeleteNote(note.id);
            c.setSelectedNoteId(null);
          }}
        >
          Eliminar nota
        </Button>
      </div>
    </div>
  );
}
