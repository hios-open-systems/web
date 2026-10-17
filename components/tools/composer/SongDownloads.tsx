'use client';
import { Button } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { serializeSong } from '@/lib/workbench/chiptune';
import { downloadBlob } from '@/lib/workbench/download';
import type { ComposerState } from './useComposerState';
import styles from './composer.module.css';

export function SongDownloads({ c }: { c: ComposerState }) {
  const hasNotes = c.song.tracks.some((track) => track.notes.length > 0);
  return (
    <div className={styles.generator}>
      <p>
        WAV y MP3 incluyen una vuelta completa con el volumen y las pistas que escuchás. MIDI permite
        continuar en otro editor o DAW.
      </p>
      <div className={styles.actions}>
        <Button
          icon={<DownloadOutlined aria-hidden="true" />}
          onClick={c.exportWav}
          disabled={!hasNotes || c.rendering}
          loading={c.rendering}
        >
          Audio WAV
        </Button>
        <Button
          icon={<DownloadOutlined aria-hidden="true" />}
          onClick={c.exportMp3}
          disabled={!hasNotes || c.rendering}
        >
          Audio MP3
        </Button>
        <Button icon={<DownloadOutlined aria-hidden="true" />} onClick={c.exportMidi} disabled={!hasNotes}>
          MIDI
        </Button>
        <Button
          onClick={() =>
            downloadBlob(
              new TextEncoder().encode(serializeSong(c.song)),
              'cancion.hios.json',
              'application/json',
            )
          }
        >
          Proyecto editable (.json)
        </Button>
        <Button onClick={c.exportDevice} disabled={!hasNotes}>
          Para parlante HIOS
        </Button>
      </div>
      <span className={styles.hint}>
        El proyecto conserva timbres y secciones. MIDI y el parlante usan sus propios sonidos.
      </span>
    </div>
  );
}
