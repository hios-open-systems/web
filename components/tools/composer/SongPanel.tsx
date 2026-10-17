'use client';
import { Button, Input, Select, Tooltip } from 'antd';
import {
  UndoOutlined,
  RedoOutlined,
  ShareAltOutlined,
  ApiOutlined,
} from '@ant-design/icons';
import { FAMOUS_SONGS } from '@/lib/workbench/chiptuneSongs';
import type { ComposerState } from './useComposerState';
import styles from './composer.module.css';

export { SongDownloads } from './SongDownloads';
export { SongLibrary } from './SongLibrary';

export function SongPanel({ c }: { c: ComposerState }) {
  return (
    <div className={styles.songRow} style={{ flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
      <Input
        aria-label="Nombre de la canción"
        value={c.song.name}
        maxLength={80}
        onChange={(e) => c.setName(e.target.value)}
        onBlur={() => {
          if (!c.song.name.trim()) c.setName('Sin título');
        }}
        className={styles.songName}
        style={{ minWidth: 160, flex: '1 1 200px' }}
      />
      <Tooltip title="Deshacer (Ctrl+Z)">
        <Button
          aria-label="Deshacer"
          icon={<UndoOutlined aria-hidden="true" />}
          disabled={!c.canUndo}
          onClick={c.undo}
        />
      </Tooltip>
      <Tooltip title="Rehacer (Ctrl+Shift+Z)">
        <Button
          aria-label="Rehacer"
          icon={<RedoOutlined aria-hidden="true" />}
          disabled={!c.canRedo}
          onClick={c.redo}
        />
      </Tooltip>
      <Select
        aria-label="Cargar tema clásico"
        placeholder="Cargar tema clásico…"
        style={{ minWidth: 180 }}
        value={null}
        options={FAMOUS_SONGS.map((s) => ({ value: s.id, label: s.label }))}
        onChange={(id) => {
          const song = FAMOUS_SONGS.find((s) => s.id === id);
          if (song) c.resetTo(song.make());
        }}
      />
      <Tooltip title="Copia un enlace con la canción entera en la URL">
        <Button icon={<ShareAltOutlined aria-hidden="true" />} onClick={c.copyShareLink}>
          Compartir
        </Button>
      </Tooltip>
      <Tooltip title="Exporta para el firmware del parlante HIOS">
        <Button icon={<ApiOutlined aria-hidden="true" />} onClick={c.exportDevice}>
          {c.deviceCopied ? '✓ Device' : 'Para parlante'}
        </Button>
      </Tooltip>
    </div>
  );
}
