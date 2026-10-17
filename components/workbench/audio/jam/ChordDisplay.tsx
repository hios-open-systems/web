'use client';

import React from 'react';
import { Tag } from 'antd';
import { getChordDetails, type JamStyleDef } from '@/lib/workbench/jamStyles.ts';
import styles from './jamStation.module.css';

interface ChordDisplayProps {
  style: JamStyleDef;
  keyRoot: number;
  currentBar: number;
  currentBeat: number;
}

export function ChordDisplay({ style, keyRoot, currentBar, currentBeat }: ChordDisplayProps) {
  const activeChord = style.bars[currentBar % style.bars.length];
  const activeDetails = getChordDetails(keyRoot, activeChord);

  return (
    <div>
      <div className={styles.chordTrack}>
        {style.bars.map((chord, idx) => {
          const { chordName } = getChordDetails(keyRoot, chord);
          const isActive = idx === currentBar;
          return (
            <div key={`bar-${idx}`} className={`${styles.chordCard} ${isActive ? styles.chordCardActive : ''}`}>
              <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 2 }}>C. {idx + 1}</div>
              <div style={{ fontSize: 16, fontWeight: 'bold', color: isActive ? '#f59e0b' : '#fff' }}>
                {chordName}
              </div>
              <div className={styles.beatDots}>
                {Array.from({ length: 4 }).map((_, b) => (
                  <div
                    key={`dot-${b}`}
                    className={`${styles.beatDot} ${isActive && b === currentBeat ? styles.beatDotActive : ''}`}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <Tag color="gold" style={{ fontSize: 13, padding: '4px 10px' }}>
          Acorde sonando: <strong>{activeDetails.chordName}</strong>
        </Tag>
        <span style={{ fontSize: 12, opacity: 0.8 }}>
          Notas clave para el solo: {activeDetails.chordTones.map((p) => ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'][p]).join(' - ')}
        </span>
      </div>
    </div>
  );
}
