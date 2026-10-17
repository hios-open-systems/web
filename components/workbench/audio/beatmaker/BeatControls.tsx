'use client';

import React from 'react';
import { Button, InputNumber, Select, Slider, Tooltip } from 'antd';
import {
  CaretRightOutlined,
  PauseOutlined,
  ShareAltOutlined,
  BranchesOutlined,
  DownloadOutlined,
  ClearOutlined,
} from '@ant-design/icons';
import { BEAT_PRESETS, type BeatProject } from '@/lib/workbench/beatmaker.ts';
import styles from './beatmaker.module.css';

interface BeatControlsProps {
  project: BeatProject;
  isPlaying: boolean;
  masterVolume: number;
  onPlay: () => void;
  onStop: () => void;
  onVolumeChange: (val: number) => void;
  onBpmChange: (bpm: number) => void;
  onSwingChange: (swing: number) => void;
  onSelectPreset: (presetId: string) => void;
  onFork: () => void;
  onShare: () => void;
  onExportWav: () => void;
  onClear: () => void;
}

export function BeatControls({
  project,
  isPlaying,
  masterVolume,
  onPlay,
  onStop,
  onVolumeChange,
  onBpmChange,
  onSwingChange,
  onSelectPreset,
  onFork,
  onShare,
  onExportWav,
  onClear,
}: BeatControlsProps) {
  return (
    <div className={styles.controlsCard}>
      <div className={styles.topRow}>
        <div className={styles.playbackGroup}>
          <Button
            type="primary"
            size="large"
            icon={isPlaying ? <PauseOutlined /> : <CaretRightOutlined />}
            onClick={isPlaying ? onStop : onPlay}
            style={{
              background: isPlaying ? '#ef4444' : '#10b981',
              borderColor: isPlaying ? '#ef4444' : '#10b981',
              fontWeight: 700,
              minWidth: 120,
            }}
          >
            {isPlaying ? 'Detener' : 'Play Loop'}
          </Button>

          <Select
            aria-label="Preset por género"
            placeholder="Cargar preset por género"
            style={{ minWidth: 210 }}
            onChange={onSelectPreset}
            options={BEAT_PRESETS.map((p) => ({
              value: p.id,
              label: `${p.genre}: ${p.name}`,
            }))}
          />
        </div>

        <div className={styles.playbackGroup}>
          <Tooltip title="Crea tu propia copia para modificarla y hacer tu versión">
            <Button icon={<BranchesOutlined />} onClick={onFork}>
              Forkear Beat
            </Button>
          </Tooltip>
          <Button icon={<ShareAltOutlined />} onClick={onShare}>
            Compartir
          </Button>
          <Button icon={<DownloadOutlined />} onClick={onExportWav}>
            Exportar WAV
          </Button>
          <Button icon={<ClearOutlined />} danger onClick={onClear}>
            Limpiar
          </Button>
        </div>
      </div>

      <div className={styles.paramGroup}>
        <div className={styles.paramItem}>
          <span>BPM:</span>
          <InputNumber
            min={60}
            max={180}
            value={project.bpm}
            onChange={(v) => v && onBpmChange(v)}
            style={{ width: 75 }}
          />
        </div>

        <div className={styles.paramItem} style={{ minWidth: 170 }}>
          <span>Swing:</span>
          <Slider
            min={0}
            max={0.5}
            step={0.01}
            value={project.swing}
            onChange={onSwingChange}
            tooltip={{ formatter: (v) => `${Math.round((v ?? 0) * 100)}%` }}
            style={{ flex: 1, margin: '0 8px' }}
          />
        </div>

        <div className={styles.paramItem} style={{ minWidth: 170 }}>
          <span>Volumen:</span>
          <Slider
            min={0}
            max={1}
            step={0.01}
            value={masterVolume}
            onChange={onVolumeChange}
            tooltip={{ formatter: (v) => `${Math.round((v ?? 0) * 100)}%` }}
            style={{ flex: 1, margin: '0 8px' }}
          />
        </div>
      </div>
    </div>
  );
}
