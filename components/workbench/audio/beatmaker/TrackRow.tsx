'use client';

import React from 'react';
import { Button, Tooltip } from 'antd';
import { PlayCircleOutlined } from '@ant-design/icons';
import { SOUND_META, type BeatTrack } from '@/lib/workbench/beatmaker.ts';
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
}

export function TrackRow({
  track,
  currentStep,
  isPlaying,
  onToggleStep,
  onCycleStepDetail,
  onPreview,
  onToggleMute,
  onToggleSolo,
}: TrackRowProps) {
  const meta = SOUND_META[track.sound];

  return (
    <div className={styles.trackRow} style={{ opacity: track.muted ? 0.45 : 1 }}>
      <div className={styles.trackInfo}>
        <div className={styles.trackLabelGroup}>
          <span className={styles.soundDot} style={{ background: meta.color }} />
          <span className={styles.trackName} title={track.name}>
            {track.name}
          </span>
        </div>

        <div className={styles.trackActions}>
          <Tooltip title="Probar sonido">
            <Button
              type="text"
              size="small"
              aria-label={`Probar ${track.name}`}
              icon={<PlayCircleOutlined />}
              onClick={onPreview}
              style={{ color: meta.color, padding: '0 4px' }}
            />
          </Tooltip>
          <Button
            size="small"
            aria-label={`Solo ${track.name}`}
            type={track.solo ? 'primary' : 'default'}
            onClick={onToggleSolo}
            style={{
              padding: '0 6px',
              fontSize: 10,
              fontWeight: 700,
              background: track.solo ? '#3b82f6' : undefined,
            }}
          >
            S
          </Button>
          <Button
            size="small"
            aria-label={`Mutear ${track.name}`}
            type={track.muted ? 'primary' : 'default'}
            danger={track.muted}
            onClick={onToggleMute}
            style={{ padding: '0 6px', fontSize: 10, fontWeight: 700 }}
          >
            M
          </Button>
        </div>
      </div>

      <div className={styles.stepsGrid}>
        {track.steps.map((st, i) => {
          const isCurrent = isPlaying && currentStep === i;
          const isBeatStart = i % 4 === 0;

          return (
            <button
              key={i}
              type="button"
              className={`${styles.stepButton} ${st.active ? styles.stepActive : ''} ${
                isCurrent ? styles.stepCurrent : ''
              } ${isBeatStart ? styles.stepBeatStart : ''}`}
              style={{
                background: st.active
                  ? `${meta.color}dd`
                  : i % 4 === 0
                  ? 'rgba(255, 255, 255, 0.05)'
                  : 'rgba(255, 255, 255, 0.02)',
                borderColor: st.active ? meta.color : undefined,
              }}
              onClick={() => onToggleStep(i)}
              onContextMenu={(e) => {
                e.preventDefault();
                onCycleStepDetail?.(i);
              }}
              title="Click: activar/desactivar | Click derecho: cambiar roll o nota"
              aria-label={`${track.name} paso ${i + 1} ${st.active ? 'activo' : 'inactivo'}`}
            >
              {st.active && (
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 800,
                    color: '#fff',
                    textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                    lineHeight: 1,
                    pointerEvents: 'none',
                    userSelect: 'none',
                  }}
                >
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
    </div>
  );
}
