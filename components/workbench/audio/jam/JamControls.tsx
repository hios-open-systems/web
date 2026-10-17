'use client';

import React from 'react';
import { Button, Select, Slider, InputNumber, Tooltip } from 'antd';
import { PlayCircleOutlined, StopOutlined, SoundOutlined } from '@ant-design/icons';
import { JAM_STYLES, type JamStyleDef } from '@/lib/workbench/jamStyles.ts';
import { GUITAR_SCALES, type GuitarScaleDef } from '@/lib/workbench/guitarScales.ts';
import { NOTE_NAMES } from '@/lib/workbench/noteFreq.ts';
import { useTapTempo } from '../useTapTempo.ts';
import styles from './jamStation.module.css';

interface JamControlsProps {
  isPlaying: boolean;
  onPlay: () => void;
  onStop: () => void;
  style: JamStyleDef;
  onSelectStyle: (style: JamStyleDef) => void;
  keyRoot: number;
  onSelectKeyRoot: (root: number) => void;
  scale: GuitarScaleDef;
  onSelectScale: (scale: GuitarScaleDef) => void;
  bpm: number;
  onBpmChange: (bpm: number) => void;
  volume: number;
  onVolumeChange: (vol: number) => void;
}

export function JamControls({
  isPlaying,
  onPlay,
  onStop,
  style,
  onSelectStyle,
  keyRoot,
  onSelectKeyRoot,
  scale,
  onSelectScale,
  bpm,
  onBpmChange,
  volume,
  onVolumeChange,
}: JamControlsProps) {
  const tap = useTapTempo(onBpmChange, 50, 240);

  return (
    <div className={styles.controlsPanel}>
      <Button
        type="primary"
        size="large"
        icon={isPlaying ? <StopOutlined /> : <PlayCircleOutlined />}
        danger={isPlaying}
        onClick={isPlaying ? onStop : onPlay}
        style={{ minWidth: 120 }}
      >
        {isPlaying ? 'Detener' : 'Tocar Base'}
      </Button>

      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 13, opacity: 0.8 }}>Estilo:</span>
        <Select
          value={style.id}
          style={{ width: 190 }}
          onChange={(id) => {
            const found = JAM_STYLES.find((s) => s.id === id);
            if (found) onSelectStyle(found);
          }}
          options={JAM_STYLES.map((s) => ({ value: s.id, label: s.name }))}
        />
      </label>

      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 13, opacity: 0.8 }}>Tono:</span>
        <Select
          value={keyRoot}
          style={{ width: 85 }}
          onChange={onSelectKeyRoot}
          options={NOTE_NAMES.map((name, idx) => ({ value: idx, label: name }))}
        />
      </label>

      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 13, opacity: 0.8 }}>Escala:</span>
        <Select
          value={scale.id}
          style={{ width: 190 }}
          onChange={(id) => {
            const found = GUITAR_SCALES.find((s) => s.id === id);
            if (found) onSelectScale(found);
          }}
          options={GUITAR_SCALES.map((s) => ({ value: s.id, label: s.name }))}
        />
      </label>

      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 13, opacity: 0.8 }}>Tempo:</span>
        <InputNumber
          min={50}
          max={240}
          value={bpm}
          onChange={(val) => val && onBpmChange(val)}
          style={{ width: 80 }}
          suffix="BPM"
        />
        <Tooltip title="Marcá el pulso haciendo clics repetidos">
          <Button size="middle" onClick={tap}>Tap</Button>
        </Tooltip>
      </div>

      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
        <SoundOutlined style={{ opacity: 0.7 }} />
        <Slider
          min={0}
          max={1}
          step={0.05}
          value={volume}
          onChange={onVolumeChange}
          style={{ width: 80 }}
        />
      </div>
    </div>
  );
}
