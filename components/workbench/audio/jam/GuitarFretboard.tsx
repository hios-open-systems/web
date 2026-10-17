'use client';

import React, { useState } from 'react';
import { Radio } from 'antd';
import { getFretNote, type GuitarScaleDef } from '@/lib/workbench/guitarScales.ts';
import styles from './jamStation.module.css';

interface GuitarFretboardProps {
  rootPitchClass: number;
  scale: GuitarScaleDef;
  activeChordTones: number[];
  onPluckNote: (midi: number) => void;
}

const FRETS_COUNT = 15;
const STRINGS_COUNT = 6;
const FRET_WIDTH = 56;
const NUT_X = 50;
const STRING_Y = [32, 58, 84, 110, 136, 162];
const INLAY_FRETS = [3, 5, 7, 9, 15];

export function GuitarFretboard({ rootPitchClass, scale, activeChordTones, onPluckNote }: GuitarFretboardProps) {
  const [displayMode, setDisplayMode] = useState<'degrees' | 'notes'>('degrees');

  const getFretX = (fret: number) => (fret === 0 ? NUT_X - 24 : NUT_X + (fret - 0.5) * FRET_WIDTH);

  return (
    <div className={styles.fretboardWrapper}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, padding: '0 8px' }}>
        <div className={styles.legend}>
          <span className={styles.legendItem}>
            <span className={styles.badgeDot} style={{ background: '#f59e0b' }} /> Tónica (Root)
          </span>
          <span className={styles.legendItem}>
            <span className={styles.badgeDot} style={{ background: '#06b6d4' }} /> Notas del acorde
          </span>
          {scale.blueNoteOffset !== undefined && (
            <span className={styles.legendItem}>
              <span className={styles.badgeDot} style={{ background: '#ec4899' }} /> Blue Note (b5)
            </span>
          )}
          <span className={styles.legendItem}>
            <span className={styles.badgeDot} style={{ background: '#475569' }} /> Escala
          </span>
        </div>
        <Radio.Group
          size="small"
          value={displayMode}
          onChange={(e) => setDisplayMode(e.target.value)}
          optionType="button"
          buttonStyle="solid"
          options={[
            { label: 'Grados (1, b3, 5)', value: 'degrees' },
            { label: 'Notas (A, C, D)', value: 'notes' },
          ]}
        />
      </div>

      <svg className={styles.fretboardSvg} viewBox="0 0 920 200">
        <rect x={NUT_X} y={20} width={FRETS_COUNT * FRET_WIDTH} height={154} fill="#1a1d24" rx={4} />

        {/* Inlay fret markers */}
        {INLAY_FRETS.map((fret) => (
          <circle key={`inlay-${fret}`} cx={getFretX(fret)} cy={97} r={5} fill="#4b5563" opacity={0.6} />
        ))}
        <circle cx={getFretX(12)} cy={65} r={5} fill="#4b5563" opacity={0.6} />
        <circle cx={getFretX(12)} cy={129} r={5} fill="#4b5563" opacity={0.6} />

        {/* Frets wires */}
        <line x1={NUT_X} y1={20} x2={NUT_X} y2={174} stroke="#cbd5e1" strokeWidth={5} />
        {Array.from({ length: FRETS_COUNT }).map((_, i) => {
          const x = NUT_X + (i + 1) * FRET_WIDTH;
          return <line key={`fret-${i}`} x1={x} y1={20} x2={x} y2={174} stroke="#64748b" strokeWidth={2} />;
        })}

        {/* Guitar strings */}
        {STRING_Y.map((y, idx) => (
          <line
            key={`str-${idx}`}
            x1={NUT_X - 35}
            y1={y}
            x2={NUT_X + FRETS_COUNT * FRET_WIDTH}
            y2={y}
            stroke="#94a3b8"
            strokeWidth={1.2 + idx * 0.4}
            opacity={0.85}
          />
        ))}

        {/* Fret notes */}
        {Array.from({ length: STRINGS_COUNT }).map((_, strIdx) =>
          Array.from({ length: FRETS_COUNT + 1 }).map((_, fret) => {
            const info = getFretNote(strIdx, fret, rootPitchClass, scale, activeChordTones);
            if (!info.isScale && !info.isChordTone) return null;

            const cx = getFretX(fret);
            const cy = STRING_Y[strIdx];
            const isHighlight = info.isRoot || info.isChordTone || info.isBlueNote;
            const fill = info.isRoot ? '#f59e0b' : info.isBlueNote ? '#ec4899' : info.isChordTone ? '#06b6d4' : '#334155';
            const label = displayMode === 'degrees' ? info.degreeLabel : info.noteName;

            return (
              <g key={`note-${strIdx}-${fret}`} style={{ cursor: 'pointer' }} onClick={() => onPluckNote(info.midi)}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHighlight ? 12 : 10}
                  fill={fill}
                  stroke={info.isRoot ? '#fff' : '#0f172a'}
                  strokeWidth={info.isRoot ? 2 : 1}
                />
                <text
                  x={cx}
                  y={cy + 4}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize={label.length > 2 ? 9 : 11}
                  fontWeight="bold"
                >
                  {label}
                </text>
              </g>
            );
          }),
        )}
      </svg>
    </div>
  );
}
