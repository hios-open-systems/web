'use client';
import { Alert } from 'antd';
import { ToolHeader } from '@/components/workbench/ToolHeader';
import { TransportBar } from '@/components/workbench/audio/chiptune/TransportBar';
import { TrackPanel } from '@/components/workbench/audio/chiptune/TrackPanel';
import { useComposerState } from './useComposerState';
import { SongPanel, SongLibrary, SongDownloads } from './SongPanel';
import { SongGenerator } from './SongGenerator';
import { ComposerEditor } from './ComposerEditor';
import { ArrangementPanel } from './ArrangementPanel';
import styles from './composer.module.css';

export function ComposerApp() {
  const c = useComposerState();
  return (
    <div className={styles.composer}>
      {c.contextHolder}
      <ToolHeader
        eyebrow="Audio Lab"
        title="Compositor Chiptune"
        description="Creá una idea de música retro, hacela tuya y descargala. Todo en tu navegador."
        locality="local"
        guideId="composer"
      />
      <section className={styles.panel} aria-label="Canción y reproducción">
        <SongPanel c={c} />
        <TransportBar c={c} />
        {c.playbackError && <Alert type="error" message={c.playbackError} showIcon />}
      </section>
      <details className={styles.details}>
        <summary>Generar una idea musical</summary>
        <SongGenerator c={c} />
      </details>
      <div className={styles.workspace}>
        <aside className={styles.panel} aria-label="Pistas">
          <h2>Pistas</h2>
          <TrackPanel
            song={c.song}
            activeTrackId={c.activeTrackId}
            onActivate={c.setActiveTrackId}
            onInstrument={c.onInstrument}
            onMute={c.onMute}
            onSolo={c.onSolo}
            onVolume={c.onVolume}
            onRename={c.onRenameTrack}
            onTimbre={c.onTimbre}
            onResetTimbre={c.onResetTimbre}
            onAddTrack={c.onAddTrack}
            onRemoveTrack={c.onRemoveTrack}
          />
        </aside>
        <ComposerEditor c={c} />
      </div>
      <section className={styles.panel} aria-label="Descargar canción">
        <h2>Descargar tu música</h2>
        <SongDownloads c={c} />
      </section>
      <details className={styles.details}>
        <summary>Biblioteca, guardar y abrir proyectos</summary>
        <SongLibrary c={c} />
      </details>
      <details className={styles.details}>
        <summary>Secciones y arreglo · avanzado</summary>
        <ArrangementPanel c={c} />
      </details>
    </div>
  );
}
