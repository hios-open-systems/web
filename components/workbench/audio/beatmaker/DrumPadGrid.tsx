'use client';

import React from 'react';
import { TrackRow } from './TrackRow.tsx';
import type { BeatProject, BeatSound, TrackFillMode } from '@/lib/workbench/beatmaker.ts';
import styles from './beatmaker.module.css';

interface DrumPadGridProps {
  project: BeatProject;
  currentStep: number;
  isPlaying: boolean;
  onToggleStep: (sound: BeatSound, stepIndex: number) => void;
  onCycleStepDetail?: (sound: BeatSound, stepIndex: number) => void;
  onPreview: (sound: BeatSound) => void;
  onToggleMute: (sound: BeatSound) => void;
  onToggleSolo: (sound: BeatSound) => void;
  onTrackVolume?: (sound: BeatSound, volume: number) => void;
  onFillTrack?: (sound: BeatSound, mode: TrackFillMode) => void;
}

export function DrumPadGrid({
  project,
  currentStep,
  isPlaying,
  onToggleStep,
  onCycleStepDetail,
  onPreview,
  onToggleMute,
  onToggleSolo,
  onTrackVolume,
  onFillTrack,
}: DrumPadGridProps) {
  return (
    <div className={styles.gridCard}>
      <div className={styles.gridHeader}>
        <div className={styles.trackHeaderCol}>Pistas e Instrumentos</div>
        <div className={styles.stepsHeaderCol}>
          {Array.from({ length: 16 }, (_, i) => {
            const beat = Math.floor(i / 4) + 1;
            const sub = (i % 4) + 1;
            const isDownbeat = i % 4 === 0;

            return (
              <div
                key={i}
                className={`${styles.beatMarker} ${isDownbeat ? styles.beatDownbeat : ''}`}
              >
                {isDownbeat ? beat : `.${sub}`}
              </div>
            );
          })}
        </div>
      </div>

      <div>
        {project.tracks.map((track) => (
          <TrackRow
            key={track.id}
            track={track}
            currentStep={currentStep}
            isPlaying={isPlaying}
            onToggleStep={(stepIdx) => onToggleStep(track.sound, stepIdx)}
            onCycleStepDetail={(stepIdx) => onCycleStepDetail?.(track.sound, stepIdx)}
            onPreview={() => onPreview(track.sound)}
            onToggleMute={() => onToggleMute(track.sound)}
            onToggleSolo={() => onToggleSolo(track.sound)}
            onVolumeChange={(vol) => onTrackVolume?.(track.sound, vol)}
            onFill={(mode) => onFillTrack?.(track.sound, mode)}
          />
        ))}
      </div>
    </div>
  );
}
