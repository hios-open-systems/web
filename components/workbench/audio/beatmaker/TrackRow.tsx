'use client';

import React from 'react';
import { Button, Popover, Slider, Tooltip } from 'antd';
import { PlayCircleOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { SOUND_META, type BeatTrack, type TrackFillMode } from '@/lib/workbench/beatmaker.ts';
import { NOTE_NAMES } from '@/lib/workbench/noteFreq.ts';
import styles from './beatmaker.module.css';

interface TrackRowProps {
  track: BeatTrack;
  currentStep: number;
  isPlaying: boolean;
  onToggleStep: (stepIndex: number) => void;
  onCycleStepDetail?: (stepIndex: number) => void;
  onPreview: () => void;
  onToggleMute: () => void;
  onToggleSolo: () => void;
  onVolumeChange?: (volume: number) => void;
  onFill?: (mode: TrackFillMode) => void;
}

export function TrackRow({
  track, currentStep, isPlaying, onToggleStep, onCycleStepDetail, onPreview, onToggleMute, onToggleSolo, onVolumeChange, onFill,
}: TrackRowProps) {
  const meta = SOUND_META[track.sound];
  return (
    <div className={styles.trackRow} style={{ opacity: track.muted ? 0.45 : 1 }}>
      <div className={styles.trackInfo}>
        <div className={styles.trackLabelGroup}>
          <span className={styles.soundDot} style={{ background: meta.color }} />
          <span className={styles.trackName} title={track.name}>{track.name}</span>
        </div>
        <div className={styles.trackActions}>
          <Tooltip title="Probar sonido">
            <Button type="text" size="small" aria-label={`Probar ${track.name}`} icon={<PlayCircleOutlined />}
              onClick={onPreview} style={{ color: meta.color, padding: '0 4px' }} />
          </Tooltip>
          <Popover trigger="click" placement="bottomLeft"
            content={<TrackChannelPopover track={track} onVolumeChange={onVolumeChange} onFill={onFill} />}>
            <Button size="small" aria-label={`Opciones de canal ${track.name}`} title="Volumen y relleno rápido del canal"
              icon={<ThunderboltOutlined />} style={{ padding: '0 5px', fontSize: 11 }} />
          </Popover>
          <Button size="small" aria-label={`Solo ${track.name}`} type={track.solo ? 'primary' : 'default'} onClick={onToggleSolo}
            style={{ padding: '0 6px', fontSize: 10, fontWeight: 700, background: track.solo ? '#3b82f6' : undefined }}>S</Button>
          <Button size="small" aria-label={`Mutear ${track.name}`} type={track.muted ? 'primary' : 'default'} danger={track.muted}
            onClick={onToggleMute} style={{ padding: '0 6px', fontSize: 10, fontWeight: 700 }}>M</Button>
        </div>
      </div>
      <TrackStepsGrid track={track} color={meta.color} currentStep={currentStep} isPlaying={isPlaying}
        onToggleStep={onToggleStep} onCycleStepDetail={onCycleStepDetail} />
    </div>
  );
}

function TrackStepsGrid({
  track, color, currentStep, isPlaying, onToggleStep, onCycleStepDetail,
}: {
  track: BeatTrack; color: string; currentStep: number; isPlaying: boolean;
  onToggleStep: (i: number) => void; onCycleStepDetail?: (i: number) => void;
}) {
  return (
    <div className={styles.stepsGrid}>
      {track.steps.map((st, i) => {
        const isCurrent = isPlaying && currentStep === i;
        return (
          <button
            key={i}
            type="button"
            className={`${styles.stepButton} ${st.active ? styles.stepActive : ''} ${isCurrent ? styles.stepCurrent : ''} ${i % 4 === 0 ? styles.stepBeatStart : ''}`}
            style={{
              background: st.active ? `${color}dd` : i % 4 === 0 ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.02)',
              borderColor: st.active ? color : undefined,
            }}
            onClick={() => onToggleStep(i)}
            onContextMenu={(e) => { e.preventDefault(); onCycleStepDetail?.(i); }}
            title="Click: activar/desactivar | Click derecho: cambiar roll o nota"
            aria-label={`${track.name} paso ${i + 1} ${st.active ? 'activo' : 'inactivo'}`}
          >
            {st.active && (
              <span className={styles.stepBadge}>
                {track.sound === 'hihat' && st.roll && st.roll > 1
                  ? `${st.roll}x`
                  : (track.sound === '808' || track.sound === 'melody') && st.pitch
                  ? `${NOTE_NAMES[st.pitch % 12]}${Math.floor(st.pitch / 12) - 1}`
                  : '•'}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function TrackChannelPopover({
  track,
  onVolumeChange,
  onFill,
}: {
  track: BeatTrack;
  onVolumeChange?: (volume: number) => void;
  onFill?: (mode: TrackFillMode) => void;
}) {
  return (
    <div className={styles.channelPopover}>
      <label className={styles.channelVolLabel}>
        <span>Volumen ({Math.round(track.volume * 100)}%)</span>
        <Slider min={0} max={1} step={0.05} value={track.volume} onChange={(v) => onVolumeChange?.(v)} />
      </label>
      <div className={styles.channelFillBtns}>
        <Button size="small" onClick={() => onFill?.('every2')}>Cada 2 (1/8)</Button>
        <Button size="small" onClick={() => onFill?.('every4')}>Cada 4 (1/4)</Button>
        <Button size="small" onClick={() => onFill?.('random')}>🎲 Random</Button>
        <Button size="small" danger onClick={() => onFill?.('clear')}>Limpiar</Button>
      </div>
    </div>
  );
}
