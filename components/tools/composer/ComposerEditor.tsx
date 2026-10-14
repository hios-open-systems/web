'use client';
import { useState } from 'react';
import { Button, Select, Segmented } from 'antd';
import { PianoRoll } from '@/components/workbench/audio/chiptune/PianoRoll';
import { NoteInspector, NOTE_LENGTHS } from './NoteInspector';
import type { ComposerState } from './useComposerState';
import styles from './composer.module.css';
import { MusicAssist } from './MusicAssist';
import { DEFAULT_SCALE, nearestScalePitch } from '@/lib/workbench/chiptuneMusic';

export function ComposerEditor({ c }: { c: ComposerState }) {
  const [zoom, setZoom] = useState(1);
  const [duration, setDuration] = useState(240);
  const [mode, setMode] = useState<'draw' | 'select'>('draw');
  const [showScale, setShowScale] = useState(true);
  const [snap, setSnap] = useState(false);
  const track = c.song.tracks.find((t) => t.id === c.activeTrackId);
  const scale = c.song.scale ?? DEFAULT_SCALE;
  const melodic = track?.instrument !== 'noise-perc';
  const pitchForEdit = (pitch: number) => snap && melodic ? nearestScalePitch(pitch, scale) : pitch;
  return (
    <section className={styles.editor} aria-label="Editor de notas">
      <div className={styles.editorHeading}>
        <h2>{track?.name ?? 'Piano roll'}</h2>
        <span className={styles.hint}>{track?.notes.length ?? 0} notas · grilla de 1/16</span>
      </div>
      <div className={styles.actions}>
        <Segmented
          aria-label="Modo de edición"
          value={mode}
          onChange={setMode}
          options={[
            { value: 'draw', label: 'Dibujar' },
            { value: 'select', label: 'Seleccionar rango' },
          ]}
        />
        <Select
          aria-label="Duración al dibujar"
          value={duration}
          onChange={setDuration}
          options={NOTE_LENGTHS}
        />
        <Button
          aria-label="Alejar piano"
          disabled={zoom <= 0.5}
          onClick={() => setZoom((z) => Math.max(0.5, z / 1.25))}
        >
          −
        </Button>
        <Button
          aria-label="Acercar piano"
          disabled={zoom >= 2.5}
          onClick={() => setZoom((z) => Math.min(2.5, z * 1.25))}
        >
          +
        </Button>
      </div>
      <p className={styles.hint}>
        {mode === 'draw'
          ? 'Tocá una celda para agregar una nota. Deslizá el fondo para recorrer el piano.'
          : 'Arrastrá sobre el piano para marcar un rango. Volvé a Dibujar para desplazarte.'}{' '}
        Tocá un compás para escuchar desde ahí.
      </p>
      <MusicAssist c={c} showScale={showScale} snap={snap} onShowScale={setShowScale} onSnap={setSnap} />
      <PianoRoll
        song={c.song}
        activeTrackId={c.activeTrackId}
        selectedNoteId={c.selectedNoteId}
        selectedRange={c.selectedRange}
        zoom={zoom}
        drawDuration={duration}
        mode={mode}
        scale={showScale && melodic ? scale : undefined}
        onRange={c.setSelectedRange}
        onSelectNote={c.selectNote}
        onChangeNote={(id, patch) => c.onChangeNote(id, patch.pitch === undefined ? patch : { ...patch, pitch: pitchForEdit(patch.pitch) })}
        onDeleteNote={c.onDeleteNote}
        onAddNote={note => c.onAddNote({ ...note, pitch: pitchForEdit(note.pitch) })}
        onSeek={c.seek}
        getPlayheadTicks={c.getPlayheadTicks}
        isPlaying={c.isPlaying}
      />
      <NoteInspector c={c} />
      <details className={styles.details}>
        <summary>Repetir y rellenar</summary>
        <p className={styles.hint}>
          Se aplica al rango seleccionado o a toda la pista. Rellenar usa el tono de la nota seleccionada (Do4
          si no hay selección).
        </p>
        <div className={styles.actions}>
          <Button onClick={c.repeatSelection} disabled={!track?.notes.length}>
            Repetir frase
          </Button>
          <Button onClick={() => c.fillActiveTrack(duration)}>
            Rellenar con {NOTE_LENGTHS.find((n) => n.value === duration)?.label.split(' · ')[0]}
          </Button>
          {c.selectedRange && <Button onClick={() => c.setSelectedRange(null)}>Quitar rango</Button>}
          <Button danger onClick={c.clearActiveTrack} disabled={!track?.notes.length}>
            Vaciar pista
          </Button>
        </div>
      </details>
    </section>
  );
}
