'use client';
import { useState } from 'react';
import { Button, Select, Segmented } from 'antd';
import { PianoRoll } from '@/components/workbench/audio/chiptune/PianoRoll';
import { NoteInspector, NOTE_LENGTHS } from './NoteInspector';
import type { ComposerState } from './useComposerState';
import styles from './composer.module.css';
import { MusicAssist } from './MusicAssist';
import { PatternTools } from './PatternTools';
import type { LaneKind } from '@/components/workbench/audio/chiptune/NoteLane';
import { DEFAULT_SCALE, nearestScalePitch } from '@/lib/workbench/chiptuneMusic';

import { EditorHeading } from './EditorHeading';
import { DrumStepGrid } from './DrumStepGrid';

export function ComposerEditor({ c }: { c: ComposerState }) {
  const [zoom, setZoom] = useState(1);
  const [duration, setDuration] = useState(240);
  const [mode, setMode] = useState<'draw' | 'select'>('draw');
  const [showScale, setShowScale] = useState(true);
  const [snap, setSnap] = useState(false);
  const [showGhostNotes, setShowGhostNotes] = useState(false);
  const [lane, setLane] = useState<LaneKind | 'none'>('velocity');
  const [drumView, setDrumView] = useState(true);
  const track = c.song.tracks.find((t) => t.id === c.activeTrackId);
  const scale = c.song.scale ?? DEFAULT_SCALE;
  const melodic = track?.instrument !== 'noise-perc';
  const showGrid = !melodic && drumView;
  const pitchForEdit = (pitch: number) => (snap && melodic ? nearestScalePitch(pitch, scale) : pitch);

  return (
    <section className={styles.editor} aria-label="Editor de notas">
      <EditorHeading track={track} drumView={drumView} onDrumView={setDrumView} />
      {track && showGrid ? (
        <DrumStepGrid
          track={track}
          steps={c.song.lengthBars * c.song.beatsPerBar * 4}
          stepsPerBar={c.song.beatsPerBar * 4}
          getPlayheadTicks={c.getPlayheadTicks}
          onNotes={(notes) => c.replaceTrackNotes(track.id, notes)}
          onPreview={(pitch) => c.previewNote(pitch, track)}
        />
      ) : (
        <>
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
          aria-pressed={showGhostNotes}
          type={showGhostNotes ? 'primary' : 'default'}
          onClick={() => setShowGhostNotes(!showGhostNotes)}
          title="Muestra u oculta las notas de las otras pistas como referencia armónica"
        >
          {showGhostNotes ? 'Ocultar otras pistas' : 'Ver otras pistas'}
        </Button>
        <Segmented
          aria-label="Carril bajo el piano roll"
          value={lane}
          onChange={setLane}
          options={[
            { value: 'velocity', label: 'Intensidad' },
            { value: 'pan', label: 'Paneo' },
            { value: 'offset', label: 'Retraso' },
            { value: 'none', label: 'Sin carril' },
          ]}
        />
        <Button aria-label="Alejar piano" disabled={zoom <= 0.5} onClick={() => setZoom((z) => Math.max(0.5, z / 1.25))}>
          −
        </Button>
        <Button aria-label="Acercar piano" disabled={zoom >= 2.5} onClick={() => setZoom((z) => Math.min(2.5, z * 1.25))}>
          +
        </Button>
      </div>
      <p className={styles.hint}>
        {mode === 'draw'
          ? 'Tocá una celda para agregar una nota. Deslizá el fondo para recorrer el piano.'
          : 'Arrastrá sobre el piano para seleccionar las notas de un rango y editarlas juntas.'}{' '}
        En la regla: tocá para escuchar desde ahí, arrastrá para marcar el loop. En el carril de abajo, arrastrá
        sobre las barras para dibujar intensidad, paneo o retraso.
      </p>
      <MusicAssist c={c} showScale={showScale} snap={snap} onShowScale={setShowScale} onSnap={setSnap} />
      <PianoRoll
        song={c.song}
        activeTrackId={c.activeTrackId}
        selectedNoteId={c.selectedNoteId}
        selectedNoteIds={c.selectedNoteIds}
        selectedRange={c.selectedRange}
        lane={lane === 'none' ? undefined : lane}
        loopActive={c.loop}
        onLoopRegion={c.setLoopRegion}
        onChangeNotes={c.onChangeNotes}
        zoom={zoom}
        drawDuration={duration}
        mode={mode}
        showGhostNotes={showGhostNotes}
        onActivateTrack={c.setActiveTrackId}
        scale={showScale && melodic ? scale : undefined}
        onRange={c.setSelectedRange}
        onSelectNote={c.selectNote}
        onChangeNote={(id, patch) => c.onChangeNote(id, patch.pitch === undefined ? patch : { ...patch, pitch: pitchForEdit(patch.pitch) })}
        onDeleteNote={c.onDeleteNote}
        onAddNote={(note) => c.onAddNote({ ...note, pitch: pitchForEdit(note.pitch) })}
        onSeek={c.seek}
        getPlayheadTicks={c.getPlayheadTicks}
        isPlaying={c.isPlaying}
      />
      <NoteInspector c={c} />
        </>
      )}
      <PatternTools c={c} duration={duration} />
    </section>
  );
}
