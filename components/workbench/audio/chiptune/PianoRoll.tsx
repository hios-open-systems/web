'use client';

import { useEffect, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { NOTE_NAMES } from '@/lib/workbench/noteFreq';
import { INSTRUMENTS, TICKS_PER_STEP, clamp, createNote, type ChiptuneNote, type ChiptuneSong } from '@/lib/workbench/chiptune';
import { PianoRollNote } from './PianoRollNote';
import { ROW_H, STEP_W, PITCH_MIN, PITCH_MAX, PITCH_COUNT, tickToX, pitchToY, durToWidth, xToStep, yToPitch } from './grid';
import styles from './chiptune.module.css';

interface Props {
  song: ChiptuneSong;
  activeTrackId: string;
  selectedNoteId: string | null;
  onSelectNote: (id: string | null) => void;
  onChangeNote: (id: string, patch: Partial<ChiptuneNote>) => void;
  onDeleteNote: (id: string) => void;
  onAddNote: (note: ChiptuneNote) => void;
  getPlayheadTicks: () => number | null;
  isPlaying: boolean;
}

const pitchLabel = (pitch: number): string =>
  `${NOTE_NAMES[((pitch % 12) + 12) % 12]}${Math.floor(pitch / 12) - 1}`;

export function PianoRoll({
  song,
  activeTrackId,
  selectedNoteId,
  onSelectNote,
  onChangeNote,
  onDeleteNote,
  onAddNote,
  getPlayheadTicks,
  isPlaying,
}: Props) {
  const steps = song.lengthBars * song.beatsPerBar * 4;
  const width = steps * STEP_W;
  const height = PITCH_COUNT * ROW_H;
  const barWidth = STEP_W * song.beatsPerBar * 4;
  const playheadRef = useRef<HTMLDivElement>(null);
  const hasActiveTrack = song.tracks.some((track) => track.id === activeTrackId);
  const pitches = Array.from({ length: PITCH_COUNT }, (_, i) => PITCH_MAX - i);

  useEffect(() => {
    const element = playheadRef.current;
    if (!isPlaying) {
      if (element) element.style.opacity = '0';
      return;
    }
    let raf = 0;
    const tick = () => {
      const ticks = getPlayheadTicks();
      if (element && ticks != null) {
        element.style.opacity = '1';
        element.style.transform = `translateX(${tickToX(ticks)}px)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying, getPlayheadTicks]);

  const handleGridPointerDown = (event: ReactPointerEvent) => {
    if (!hasActiveTrack) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const step = xToStep(event.clientX - rect.left);
    const pitch = clamp(yToPitch(event.clientY - rect.top), PITCH_MIN, PITCH_MAX);
    onAddNote(createNote(pitch, step * TICKS_PER_STEP, TICKS_PER_STEP * 2));
  };

  return (
    <div className={styles.roll}>
      <div className={styles.rollScroll}>
        <div className={styles.rollInner} style={{ height }}>
          <div className={styles.rollGutter} style={{ height }}>
            {pitches.map((pitch) => (
              <div
                key={pitch}
                className={`${styles.rollLabel} ${pitch % 12 === 0 ? styles.rollLabelC : ''}`}
                style={{ height: ROW_H }}
              >
                {pitchLabel(pitch)}
              </div>
            ))}
          </div>
          <div
            className={styles.rollGrid}
            style={{
              width,
              height,
              backgroundImage:
                'linear-gradient(rgba(128,128,128,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(128,128,128,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(128,128,128,0.24) 1px, transparent 1px)',
              backgroundSize: `100% ${ROW_H}px, ${STEP_W}px 100%, ${barWidth}px 100%`,
            }}
            onPointerDown={handleGridPointerDown}
          >
            {song.tracks.map((track) => {
              const color = INSTRUMENTS[track.instrument].color;
              const active = track.id === activeTrackId;
              return track.notes.map((note) =>
                active ? (
                  <PianoRollNote
                    key={note.id}
                    note={note}
                    color={color}
                    selected={selectedNoteId === note.id}
                    onSelect={onSelectNote}
                    onChange={onChangeNote}
                    onDelete={onDeleteNote}
                  />
                ) : (
                  <div
                    key={note.id}
                    className={styles.noteGhost}
                    style={{
                      left: tickToX(note.start),
                      top: pitchToY(note.pitch),
                      width: Math.max(STEP_W - 2, durToWidth(note.duration) - 2),
                      height: ROW_H - 2,
                      background: color,
                    }}
                  />
                ),
              );
            })}
            <div ref={playheadRef} className={styles.playhead} style={{ height }} />
          </div>
        </div>
      </div>
    </div>
  );
}
