'use client';
import { useState } from 'react';
import { Button, Select, Segmented } from 'antd';
import { PianoRoll } from '@/components/workbench/audio/chiptune/PianoRoll';
import { NoteInspector, NOTE_LENGTHS } from './NoteInspector';
import type { ComposerState } from './useComposerState';
import styles from './composer.module.css';
import { MusicAssist } from './MusicAssist';
import { DEFAULT_SCALE, nearestScalePitch } from '@/lib/workbench/chiptuneMusic';

import { INSTRUMENTS } from '@/lib/workbench/chiptune';

export function ComposerEditor({ c }: { c: ComposerState }) {
  const [zoom, setZoom] = useState(1);
  const [duration, setDuration] = useState(240);
  const [mode, setMode] = useState<'draw' | 'select'>('draw');
  const [showScale, setShowScale] = useState(true);
  const [snap, setSnap] = useState(false);
  const [showGhostNotes, setShowGhostNotes] = useState(false);
  const track = c.song.tracks.find((t) => t.id === c.activeTrackId);
  const scale = c.song.scale ?? DEFAULT_SCALE;
  const melodic = track?.instrument !== 'noise-perc';
  const pitchForEdit = (pitch: number) => (snap && melodic ? nearestScalePitch(pitch, scale) : pitch);

  return (
    <section className={styles.editor} aria-label="Editor de notas">
      <div className={styles.editorHeading}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <h2>{track?.name ?? 'Piano roll'}</h2>
          {track && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '2px 10px',
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 600,
                background: `${INSTRUMENTS[track.instrument]?.color ?? '#6366f1'}22`,
                border: `1px solid ${INSTRUMENTS[track.instrument]?.color ?? '#6366f1'}66`,
                color: INSTRUMENTS[track.instrument]?.color ?? 'inherit',
              }}
            >
              {track.instrument === 'noise-perc' ? '🥁 Batería / Drum Machine' : INSTRUMENTS[track.instrument]?.label}
            </span>
          )}
        </div>
        <span className={styles.hint}>
          {track?.instrument === 'noise-perc'
            ? `${track.notes.length} golpes · grilla 1/16 · Bombo (36), Caja (38), Hi-Hat (42/46), Crash (49)`
            : `${track?.notes.length ?? 0} notas · grilla de 1/16`}
        </span>
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
          aria-pressed={showGhostNotes}
          type={showGhostNotes ? 'primary' : 'default'}
          onClick={() => setShowGhostNotes(!showGhostNotes)}
          title="Muestra u oculta las notas de las otras pistas como referencia armónica"
        >
          {showGhostNotes ? 'Ocultar otras pistas' : 'Ver otras pistas'}
        </Button>
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
      <div style={{ marginTop: 12, padding: '10px 12px', background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
          <strong style={{ fontSize: 13, color: 'var(--text-primary)' }}>Herramientas de patrón y pista</strong>
          <span className={styles.hint} style={{ margin: 0 }}>
            Aplica al rango seleccionado o a toda la pista.
          </span>
        </div>
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
      </div>
    </section>
  );
}
