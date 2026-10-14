'use client';

import { useEffect, useRef } from 'react';
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from 'react';
import { NOTE_NAMES } from '@/lib/workbench/noteFreq';
import { TICKS_PER_STEP, clamp, createNote, type ChiptuneNote, type ChiptuneSong } from '@/lib/workbench/chiptune';
import { usePlayhead } from './usePlayhead';
import { PianoRollTracks } from './PianoRollTracks';
import { ROW_H, STEP_W, RULER_H, PITCH_MIN, PITCH_MAX, PITCH_COUNT, tickToX, pitchToY, xToStep, yToPitch } from './grid';
import styles from './chiptune.module.css';
import type { MusicalScale } from '@/lib/workbench/chiptuneMusic';
import { ScaleRows } from './ScaleRows';

interface Props {
  scale?: MusicalScale;
  song: ChiptuneSong;
  activeTrackId: string;
  selectedNoteId: string | null;
  selectedRange?: { startTick: number; endTick: number } | null;
  zoom?: number;
  drawDuration?: number;
  mode?: 'draw' | 'select';
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
  drawDuration = TICKS_PER_STEP * 2,
  mode = 'draw',
  onRange,
  onSelectNote,
  onChangeNote,
  onDeleteNote,
  onAddNote,
  onSeek,
  getPlayheadTicks,
  scale,
}: Props) {
  const stepW = STEP_W * zoom;
  const rowH = ROW_H * zoom;
  const steps = song.lengthBars * song.beatsPerBar * 4;
  const width = steps * stepW;
  const height = PITCH_COUNT * rowH;
  const barWidth = stepW * song.beatsPerBar * 4;
  const playheadRef = usePlayhead(getPlayheadTicks, stepW);
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeTrack = song.tracks.find(track => track.id === activeTrackId);
  const centerPitch = activeTrack?.notes.length
    ? Math.round(activeTrack.notes.reduce((total, note) => total + note.pitch, 0) / activeTrack.notes.length) : 60;
  const centerRef = useRef(centerPitch);
  centerRef.current = centerPitch;
  useEffect(() => {
    const scroll = scrollRef.current;
    if (scroll) scroll.scrollTop = Math.max(0, pitchToY(centerRef.current, rowH) - scroll.clientHeight / 2);
  }, [activeTrackId, rowH]);
  const hasActiveTrack = song.tracks.some((track) => track.id === activeTrackId);
  const pitches = Array.from({ length: PITCH_COUNT }, (_, i) => PITCH_MAX - i);
  const bars = Array.from({ length: song.lengthBars }, (_, i) => i);

  // Tap-vs-pan: agrega en pointerUp si casi no hubo movimiento (un scroll mueve o cancela).
  const tapRef = useRef<{ x: number; y: number } | null>(null);
  const onGridPointerDown = (event: ReactPointerEvent) => {
    if (!hasActiveTrack || event.button !== 0) return;
    tapRef.current = { x: event.clientX, y: event.clientY };
    if (mode === 'select') event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onGridPointerUp = (event: ReactPointerEvent) => {
    const tap = tapRef.current;
    tapRef.current = null;
    if (!tap || !hasActiveTrack) return;
    const rect = event.currentTarget.getBoundingClientRect();
    // Drag horizontal = marquee de rango; tap (poco movimiento) = agregar nota.
    if (Math.abs(event.clientX - tap.x) > 6 || Math.abs(event.clientY - tap.y) > 6) {
      if (onRange && mode === 'select') {
        const a = xToStep(Math.min(tap.x, event.clientX) - rect.left, stepW) * TICKS_PER_STEP;
        const b = xToStep(Math.max(tap.x, event.clientX) - rect.left, stepW) * TICKS_PER_STEP;
        onRange(b > a ? { startTick: Math.min(a, steps * TICKS_PER_STEP), endTick: Math.min(b, steps * TICKS_PER_STEP) } : null);
      }
      return;
    }
    if (mode === 'select') { onRange?.(null); return; }
    const step = clamp(Math.floor((event.clientX - rect.left) / stepW), 0, steps - 1);
    const pitch = clamp(yToPitch(event.clientY - rect.top, rowH), PITCH_MIN, PITCH_MAX);
    onAddNote(createNote(pitch, step * TICKS_PER_STEP, Math.min(drawDuration, (steps - step) * TICKS_PER_STEP)));
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
      <div className={styles.rollScroll} ref={scrollRef} aria-label="Piano roll" tabIndex={0}>
        <div className={styles.rollInner} style={{ height: height + RULER_H }}>
          <div className={styles.rollGutter} style={{ height: height + RULER_H }}>
            <div className={styles.rollCorner} style={{ height: RULER_H }} />
            {pitches.map((pitch) => (
              <div
                key={pitch}
                className={`${styles.rollLabel} ${pitch % 12 === 0 ? styles.rollLabelC : ''} ${[1, 3, 6, 8, 10].includes(pitch % 12) ? styles.blackKey : ''}`}
                style={{ height: rowH }}
              >
                {scale && pitch % 12 === scale.root ? '● ' : ''}{pitchLabel(pitch)}
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
                touchAction: mode === 'select' ? 'none' : 'pan-x pan-y',
                backgroundImage:
                  'linear-gradient(rgba(128,128,128,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(128,128,128,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(128,128,128,0.24) 1px, transparent 1px)',
                backgroundSize: `100% ${rowH}px, ${stepW}px 100%, ${barWidth}px 100%`,
              }}
              onPointerDown={onGridPointerDown}
              onPointerUp={onGridPointerUp}
              onPointerCancel={onGridPointerCancel}
            >
              {scale && <ScaleRows scale={scale} rowH={rowH} />}
              <PianoRollTracks song={song} activeTrackId={activeTrackId} selectedNoteId={selectedNoteId}
                stepW={stepW} rowH={rowH} onSelectNote={onSelectNote} onChangeNote={onChangeNote} onDeleteNote={onDeleteNote} />
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
