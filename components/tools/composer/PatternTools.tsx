'use client';
import { Button } from 'antd';
import { NOTE_LENGTHS } from './NoteInspector';
import type { ComposerState } from './useComposerState';
import styles from './composer.module.css';

/** Repetir, rellenar y vaciar: operan sobre el rango seleccionado o la pista entera. */
export function PatternTools({ c, duration }: { c: ComposerState; duration: number }) {
  const track = c.song.tracks.find((t) => t.id === c.activeTrackId);
  return (
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
  );
}
