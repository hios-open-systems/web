'use client';
import { useRef, useState } from 'react';
import { Alert, Button, Input, Select } from 'antd';
import {
  DownloadOutlined,
  UploadOutlined,
  UndoOutlined,
  RedoOutlined,
  ShareAltOutlined,
} from '@ant-design/icons';
import { UrlPresets } from '@/components/common/UrlPresets';
import { FAMOUS_SONGS } from '@/lib/workbench/chiptuneSongs';
import { parseSong, serializeSong } from '@/lib/workbench/chiptune';
import { downloadBlob } from '@/lib/workbench/download';
import { decodeShare, encodeShare } from './registry';
import type { ComposerState } from './useComposerState';
import styles from './composer.module.css';

export function SongPanel({ c }: { c: ComposerState }) {
  return (
    <div className={styles.songRow}>
      <Input
        aria-label="Nombre de la canción"
        value={c.song.name}
        maxLength={80}
        onChange={(e) => c.setName(e.target.value)}
        onBlur={() => {
          if (!c.song.name.trim()) c.setName('Sin título');
        }}
        className={styles.songName}
      />
      <Button
        aria-label="Deshacer"
        title="Deshacer (Ctrl+Z)"
        icon={<UndoOutlined aria-hidden="true" />}
        disabled={!c.canUndo}
        onClick={c.undo}
      />
      <Button
        aria-label="Rehacer"
        title="Rehacer (Ctrl+Shift+Z)"
        icon={<RedoOutlined aria-hidden="true" />}
        disabled={!c.canRedo}
        onClick={c.redo}
      />
    </div>
  );
}

export function SongLibrary({ c }: { c: ComposerState }) {
  const file = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const importFile = async (input: File | undefined) => {
    if (!input) return;
    if (input.size > 2_000_000) {
      setError('El proyecto es demasiado grande (máximo 2 MB).');
      return;
    }
    try {
      const song = parseSong(await input.text());
      if (!song) throw new Error('Invalid project');
      c.resetTo(song);
      setError(null);
    } catch {
      setError('No se pudo abrir. Elegí un proyecto JSON descargado desde este compositor.');
    }
  };
  return (
    <div className={styles.generator}>
      <p>
        El borrador se guarda en este navegador. Guardá una configuración con nombre o descargá el proyecto
        para conservarlo.
      </p>
      <div className={styles.actions}>
        <Select
          aria-label="Cargar canción"
          placeholder="Cargar un ejemplo"
          style={{ width: 220, maxWidth: '100%' }}
          value={null}
          options={FAMOUS_SONGS.map((s) => ({ value: s.id, label: s.label }))}
          onChange={(id) => {
            const song = FAMOUS_SONGS.find((s) => s.id === id);
            if (song) c.resetTo(song.make());
          }}
        />
        <Button onClick={c.clear}>Nueva canción</Button>
        <UrlPresets
          storageKey="composer"
          getQuery={() => `s=${encodeShare(c.song)}`}
          onLoadQuery={(query) => {
            const song = decodeShare(new URLSearchParams(query).get('s') ?? '');
            if (song) {
              c.resetTo(song);
              setError(null);
            } else
              setError('Esta configuración no contiene una canción. Guardala de nuevo desde tu borrador.');
          }}
        />
        <Button icon={<UploadOutlined aria-hidden="true" />} onClick={() => file.current?.click()}>
          Abrir proyecto
        </Button>
        <Button icon={<ShareAltOutlined aria-hidden="true" />} onClick={c.copyShareLink}>
          Compartir enlace
        </Button>
        <input
          ref={file}
          type="file"
          accept=".json,application/json"
          hidden
          onChange={(e) => {
            void importFile(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
      </div>
      {error && <Alert type="error" message={error} showIcon closable onClose={() => setError(null)} />}
    </div>
  );
}

export function SongDownloads({ c }: { c: ComposerState }) {
  const hasNotes = c.song.tracks.some((track) => track.notes.length > 0);
  return (
    <div className={styles.generator}>
      <p>
        WAV y MP3 incluyen una vuelta completa con el volumen y las pistas que escuchás. MIDI permite
        continuar en otro editor.
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
