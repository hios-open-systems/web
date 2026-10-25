'use client';
import { Alert, Button } from 'antd';
import { PlayCircleOutlined, SoundOutlined } from '@ant-design/icons';
import { ToolHeader } from '@/components/workbench/ToolHeader';
import { TransportBar } from '@/components/workbench/audio/chiptune/TransportBar';
import { TrackPanel } from '@/components/workbench/audio/chiptune/TrackPanel';
import { useComposerState } from './useComposerState';
import { SongPanel, SongLibrary, SongDownloads } from './SongPanel';
import { SongGenerator } from './SongGenerator';
import { MidiToolbar } from './MidiToolbar';
import { QuickExport } from './QuickExport';
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
        title="Compositor Chiptune & Retro Synth"
        description="Creá música retro y synthwave, generá ideas procedurales, editalas en el piano-roll y descargalas. Todo en tu navegador."
        locality="local"
        guideId="composer"
        actions={
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button size="small" icon={<PlayCircleOutlined />} href="/workbench/beatmaker">
              Beatmaker DAW
            </Button>
            <Button size="small" icon={<PlayCircleOutlined />} href="/workbench/jam-station">
              Jam Station
            </Button>
            <Button size="small" icon={<SoundOutlined />} href="/workbench/guitar-tuner">
              Afinador
            </Button>
          </div>
        }
      />
      <section className={styles.panel} aria-label="Generador de ideas musicales">
        <h2 style={{ fontSize: 16, margin: '0 0 10px', color: 'var(--text-primary)' }}>Generar una idea musical</h2>
        <SongGenerator c={c} />
      </section>

      {/* Reproducción pegada al generador y al piano roll; queda fija al hacer scroll. */}
      <div className={styles.studio}>
        <section className={`${styles.panel} ${styles.transportSticky}`} aria-label="Reproducción">
          <TransportBar c={c} />
          {c.playbackError && <Alert type="error" message={c.playbackError} showIcon />}
        </section>

        <div className={styles.workspace}>
          <aside className={styles.panel} aria-label="Pistas">
            <h2>Pistas</h2>
            <TrackPanel
              song={c.song}
              activeTrackId={c.activeTrackId}
              onActivate={c.setActiveTrackId}
              onInstrument={c.onInstrument}
              onSound={c.onSound}
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
      </div>

      <section className={styles.panel} aria-label="Canción, compartir y MIDI">
        <SongPanel c={c} />
        <QuickExport c={c} />
        <MidiToolbar c={c} />
      </section>

      <section className={styles.panel} aria-label="Descargar canción">
        <h2>Descargar tu música</h2>
        <SongDownloads c={c} />
      </section>

      <section className={styles.panel} aria-label="Biblioteca, guardar y abrir proyectos">
        <h2 style={{ fontSize: 16, margin: '0 0 10px', color: 'var(--text-primary)' }}>Biblioteca, guardar y abrir proyectos</h2>
        <SongLibrary c={c} />
      </section>

      <section className={styles.panel} aria-label="Secciones y arreglo · avanzado">
        <h2 style={{ fontSize: 16, margin: '0 0 10px', color: 'var(--text-primary)' }}>Secciones y arreglo · avanzado</h2>
        <ArrangementPanel c={c} />
      </section>
    </div>
  );
}
