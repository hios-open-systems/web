'use client';

import React from 'react';
import { Button, Tooltip } from 'antd';
import { PlayCircleOutlined } from '@ant-design/icons';
import { SOUND_META, type BeatTrack } from '@/lib/workbench/beatmaker.ts';
import styles from './beatmaker.module.css';

interface TrackRowProps {
  track: BeatTrack;
  currentStep: number;
  isPlaying: boolean;
  onToggleStep: (stepIndex: number) => void;
  onPreview: () => void;
  onToggleMute: () => void;
  onToggleSolo: () => void;
}

export function TrackRow({
  track,
  currentStep,
  isPlaying,
  onToggleStep,
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
              aria-label={`${track.name} paso ${i + 1} ${st.active ? 'activo' : 'inactivo'}`}
            >
              {st.active && (
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#fff',
                    boxShadow: '0 0 4px #fff',
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
