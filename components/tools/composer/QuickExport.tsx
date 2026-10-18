'use client';
import { Button } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import type { ComposerState } from './useComposerState';
import styles from './composer.module.css';

/** Descarga rápida (.mid/.wav/.mp3), fuera de la barra fija de reproducción para que quede compacta. */
export function QuickExport({ c }: { c: ComposerState }) {
  const hasNotes = c.song.tracks.some((t) => t.notes.length > 0);
  return (
    <div className={styles.actions}>
      <span style={{ fontSize: 12, opacity: 0.75, marginRight: 4 }}>Exportación rápida:</span>
      <Button size="small" icon={<DownloadOutlined />} onClick={c.exportMidi} disabled={!hasNotes}>
        .mid
      </Button>
      <Button size="small" icon={<DownloadOutlined />} loading={c.rendering} onClick={c.exportWav} disabled={!hasNotes || c.rendering}>
        .wav
      </Button>
      <Button size="small" icon={<DownloadOutlined />} loading={c.rendering} onClick={c.exportMp3} disabled={!hasNotes || c.rendering}>
        .mp3
      </Button>
    </div>
  );
}
