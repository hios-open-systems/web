'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { Button, Tooltip, Switch, Tag, message } from 'antd';
import { ThunderboltOutlined, UploadOutlined } from '@ant-design/icons';
import { useWebMidi } from '@/lib/workbench/useWebMidi';
import { decodeMidi } from '@/lib/workbench/chiptuneMidiImport';
import { createNote, TICKS_PER_STEP } from '@/lib/workbench/chiptune';
import type { ComposerState } from './useComposerState';
import styles from './composer.module.css';

interface MidiToolbarProps {
  c: ComposerState;
}

export function MidiToolbar({ c }: MidiToolbarProps) {
  const [mounted, setMounted] = useState(false);
  const [recordMode, setRecordMode] = useState(false);
  const playheadRef = useRef(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleNoteOn = useCallback((pitch: number, velocity: number) => {
    const activeTrack = c.song.tracks.find((t) => t.id === c.activeTrackId);
    if (!activeTrack) return;
    if (recordMode) {
      const tick = c.isPlaying ? c.getPlayheadTicks() : playheadRef.current;
      c.onAddNote(createNote(pitch, tick, TICKS_PER_STEP * 2, velocity));
      if (!c.isPlaying) playheadRef.current += TICKS_PER_STEP * 2;
    }
  }, [c, recordMode]);

  const { supported, connected, devices, lastNote, connect } = useWebMidi({
    onNoteOn: handleNoteOn,
  });

  const handleImportMidi = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.mid,.midi';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const buffer = await file.arrayBuffer();
        const imported = decodeMidi(buffer);
        c.resetTo(imported);
        message.success(`MIDI "${file.name}" importado (${imported.tracks.length} pistas)`);
      } catch (err) {
        message.error(err instanceof Error ? err.message : 'Error al importar archivo MIDI');
      }
    };
    input.click();
  }, [c]);

  const activeDeviceName = devices[0]?.name ?? 'Teclado MIDI';

  if (!mounted) return null;

  return (
    <div className={styles.actions} style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
      <Tooltip title="Importá cualquier archivo .mid estándar a pistas de audio chiptune">
        <Button icon={<UploadOutlined />} onClick={handleImportMidi}>
          Importar .mid
        </Button>
      </Tooltip>

      {supported && !connected && (
        <Tooltip title="Conectá tu teclado USB/Bluetooth MIDI físico para tocar o grabar">
          <Button icon={<ThunderboltOutlined />} onClick={connect}>
            Conectar teclado MIDI
          </Button>
        </Tooltip>
      )}

      {connected && (
        <>
          <Tag color="cyan">🎹 {activeDeviceName}</Tag>
          <label className={styles.inlineField}>
            <span>Grabar al tocar:</span>
            <Switch size="small" checked={recordMode} onChange={setRecordMode} />
          </label>
          {lastNote && (
            <span style={{ fontSize: 12, opacity: 0.8 }}>
              Nota: <strong>{lastNote.pitch}</strong> (vel {lastNote.velocity})
            </span>
          )}
        </>
      )}
    </div>
  );
}
