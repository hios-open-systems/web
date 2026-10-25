'use client';

import React from 'react';
import { NOTE_NAMES } from '@/lib/workbench/noteFreq';
import { formatDrumPitch, getDrumInfo } from '@/lib/workbench/drumMap';
import type { MusicalScale } from '@/lib/workbench/chiptuneMusic';
import { RULER_H } from './grid';
import styles from './chiptune.module.css';

interface PianoRollGutterProps {
  height: number;
  rowH: number;
  pitches: number[];
  isDrumTrack: boolean;
  scale?: MusicalScale;
  onPreviewPitch?: (pitch: number) => void;
}

const pitchLabel = (pitch: number): string =>
  `${NOTE_NAMES[((pitch % 12) + 12) % 12]}${Math.floor(pitch / 12) - 1}`;

export function PianoRollGutter({ height, rowH, pitches, isDrumTrack, scale, onPreviewPitch }: PianoRollGutterProps) {
  return (
    <div className={styles.rollGutter} style={{ height: height + RULER_H }}>
      <div className={styles.rollCorner} style={{ height: RULER_H }} />
      {pitches.map((pitch) => {
        const drum = isDrumTrack ? getDrumInfo(pitch) : undefined;
        return (
          <div
            key={pitch}
            className={`${styles.rollLabel} ${pitch % 12 === 0 ? styles.rollLabelC : ''} ${
              !isDrumTrack && [1, 3, 6, 8, 10].includes(pitch % 12) ? styles.blackKey : ''
            }`}
            style={{
              height: rowH,
              fontWeight: drum ? 600 : undefined,
              color: drum ? 'var(--text-primary)' : undefined,
              background: drum ? 'rgba(251, 113, 133, 0.08)' : undefined,
              cursor: onPreviewPitch ? 'pointer' : undefined,
            }}
            onPointerDown={() => onPreviewPitch?.(pitch)}
            title={drum ? `Click para escuchar: ${drum.name} (MIDI ${pitch})` : `Click para escuchar: ${pitchLabel(pitch)} (MIDI ${pitch})`}
          >
            {isDrumTrack
              ? formatDrumPitch(pitch)
              : `${scale && pitch % 12 === scale.root ? '● ' : ''}${pitchLabel(pitch)}`}
          </div>
        );
      })}
    </div>
  );
}
