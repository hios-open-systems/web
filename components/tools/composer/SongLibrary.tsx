'use client';
import { useRef, useState } from 'react';
import { Alert, Button, Select } from 'antd';
import { UploadOutlined, ShareAltOutlined } from '@ant-design/icons';
import { UrlPresets } from '@/components/common/UrlPresets';
import { FAMOUS_SONGS } from '@/lib/workbench/chiptuneSongs';
import { parseSong } from '@/lib/workbench/chiptune';
import { decodeShare, encodeShare } from './registry';
import type { ComposerState } from './useComposerState';
import styles from './composer.module.css';

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
            } else {
              setError('Esta configuración no contiene una canción. Guardala de nuevo desde tu borrador.');
            }
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
