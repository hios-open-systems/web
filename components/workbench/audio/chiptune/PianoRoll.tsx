'use client';

import { useEffect, useRef } from 'react';
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from 'react';
import { NOTE_NAMES } from '@/lib/workbench/noteFreq';
import { INSTRUMENTS, TICKS_PER_STEP, clamp, createNote, type ChiptuneNote, type ChiptuneSong } from '@/lib/workbench/chiptune';
import { PianoRollNote } from './PianoRollNote';
import { ROW_H, STEP_W, RULER_H, PITCH_MIN, PITCH_MAX, PITCH_COUNT, tickToX, pitchToY, durToWidth, xToStep, yToPitch } from './grid';
import styles from './chiptune.module.css';

interface Props {
  song: ChiptuneSong;
  activeTrackId: string;
  selectedNoteId: string | null;
  selectedRange?: { startTick: number; endTick: number } | null;
  zoom?: number;
  onRange?: (range: { startTick: number; endTick: number } | null) => void;
  onSelectNote: (id: string | null) => void;
  onChangeNote: (id: string, patch: Partial<ChiptuneNote>) => void;
  onDeleteNote: (id: string) => void;
  onAddNote: (note: ChiptuneNote) => void;
  onSeek?: (tick: number) => void;
  getPlayheadTicks: () => number | null;
  isPlaying: boolean;
}

const pitchLabel = (pitch: number): string =>
  `${NOTE_NAMES[((pitch % 12) + 12) % 12]}${Math.floor(pitch / 12) - 1}`;

export function PianoRoll({
  song,
  activeTrackId,
  selectedNoteId,
  selectedRange,
  zoom = 1,
  onRange,
  onSelectNote,
  onChangeNote,
  onDeleteNote,
  onAddNote,
  onSeek,
  getPlayheadTicks,
  isPlaying,
}: Props) {
  const stepW = STEP_W * zoom;
  const rowH = ROW_H * zoom;
  const steps = song.lengthBars * song.beatsPerBar * 4;
  const width = steps * stepW;
  const height = PITCH_COUNT * rowH;
  const barWidth = stepW * song.beatsPerBar * 4;
  const playheadRef = useRef<HTMLDivElement>(null);
  const hasActiveTrack = song.tracks.some((track) => track.id === activeTrackId);
  const pitches = Array.from({ length: PITCH_COUNT }, (_, i) => PITCH_MAX - i);
  const bars = Array.from({ length: song.lengthBars }, (_, i) => i);

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
        element.style.transform = `translateX(${tickToX(ticks, stepW)}px)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying, getPlayheadTicks, stepW]);

  // Tap-vs-pan: agrega en pointerUp si casi no hubo movimiento (un scroll mueve o cancela).
  const tapRef = useRef<{ x: number; y: number } | null>(null);
  const onGridPointerDown = (event: ReactPointerEvent) => {
    if (!hasActiveTrack) return;
    tapRef.current = { x: event.clientX, y: event.clientY };
  };
  const onGridPointerUp = (event: ReactPointerEvent) => {
    const tap = tapRef.current;
    tapRef.current = null;
    if (!tap || !hasActiveTrack) return;
    const rect = event.currentTarget.getBoundingClientRect();
    // Drag horizontal = marquee de rango; tap (poco movimiento) = agregar nota.
    if (Math.abs(event.clientX - tap.x) > 6 || Math.abs(event.clientY - tap.y) > 6) {
      if (onRange) {
        const a = xToStep(Math.min(tap.x, event.clientX) - rect.left, stepW) * TICKS_PER_STEP;
        const b = xToStep(Math.max(tap.x, event.clientX) - rect.left, stepW) * TICKS_PER_STEP;
        onRange(b > a ? { startTick: a, endTick: b } : null);
      }
      return;
    }
    const step = xToStep(event.clientX - rect.left, stepW);
    const pitch = clamp(yToPitch(event.clientY - rect.top, rowH), PITCH_MIN, PITCH_MAX);
    onAddNote(createNote(pitch, step * TICKS_PER_STEP, TICKS_PER_STEP * 2));
  };
  const onGridPointerCancel = () => {
    tapRef.current = null;
  };

  const onRulerClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (!onSeek) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const tick = Math.max(0, ((event.clientX - rect.left) / stepW) * TICKS_PER_STEP);
    onSeek(tick);
  };

  return (
    <div className={styles.roll}>
      <div className={styles.rollScroll}>
        <div className={styles.rollInner} style={{ height: height + RULER_H }}>
          <div className={styles.rollGutter} style={{ height: height + RULER_H }}>
            <div className={styles.rollCorner} style={{ height: RULER_H }} />
            {pitches.map((pitch) => (
              <div
                key={pitch}
                className={`${styles.rollLabel} ${pitch % 12 === 0 ? styles.rollLabelC : ''}`}
                style={{ height: rowH }}
              >
                {pitchLabel(pitch)}
              </div>
            ))}
          </div>

          <div className={styles.rollGridWrap} style={{ width }}>
            <div className={styles.rollRuler} style={{ width, height: RULER_H }} onClick={onRulerClick}>
              {bars.map((i) => (
                <span key={i} className={styles.rollBar} style={{ left: i * barWidth, width: barWidth }}>
                  {i + 1}
                </span>
              ))}
            </div>

            <div
              className={styles.rollGrid}
              style={{
                width,
                height,
                backgroundImage:
                  'linear-gradient(rgba(128,128,128,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(128,128,128,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(128,128,128,0.24) 1px, transparent 1px)',
                backgroundSize: `100% ${rowH}px, ${stepW}px 100%, ${barWidth}px 100%`,
              }}
              onPointerDown={onGridPointerDown}
              onPointerUp={onGridPointerUp}
              onPointerCancel={onGridPointerCancel}
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
                      stepW={stepW}
                      rowH={rowH}
                      onSelect={onSelectNote}
                      onChange={onChangeNote}
                      onDelete={onDeleteNote}
                    />
                  ) : (
                    <div
                      key={note.id}
                      className={styles.noteGhost}
                      style={{
                        left: tickToX(note.start, stepW),
                        top: pitchToY(note.pitch, rowH),
                        width: Math.max(stepW - 2, durToWidth(note.duration, stepW) - 2),
                        height: rowH - 2,
                        background: color,
                      }}
                    />
                  ),
                );
              })}
              {selectedRange && selectedRange.endTick > selectedRange.startTick && (
                <div
                  className={styles.rollRange}
                  style={{
                    left: tickToX(selectedRange.startTick, stepW),
                    width: tickToX(selectedRange.endTick - selectedRange.startTick, stepW),
                    height,
                  }}
                />
              )}
              <div ref={playheadRef} className={styles.playhead} style={{ height }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
