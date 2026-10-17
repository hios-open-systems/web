'use client';

import { useEffect, useRef } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import { TICKS_PER_STEP } from '@/lib/workbench/chiptune';
import { usePlayhead } from './usePlayhead';
import { usePianoRollPointer } from './usePianoRollPointer';
import { PianoRollTracks } from './PianoRollTracks';
import { PianoRollGutter } from './PianoRollGutter';
import { ROW_H, STEP_W, RULER_H, PITCH_COUNT, PITCH_MAX, tickToX, pitchToY } from './grid';
import styles from './chiptune.module.css';
import { ScaleRows } from './ScaleRows';
import type { PianoRollProps } from './pianoRollTypes';

export function PianoRoll({
  song,
  activeTrackId,
  selectedNoteId,
  selectedRange,
  zoom = 1,
  drawDuration = TICKS_PER_STEP * 2,
  mode = 'draw',
  showGhostNotes = false,
  onActivateTrack,
  onRange,
  onSelectNote,
  onChangeNote,
  onDeleteNote,
  onAddNote,
  onSeek,
  getPlayheadTicks,
  scale,
}: PianoRollProps) {
  const stepW = STEP_W * zoom;
  const rowH = ROW_H * zoom;
  const steps = song.lengthBars * song.beatsPerBar * 4;
  const width = steps * stepW;
  const height = PITCH_COUNT * rowH;
  const barWidth = stepW * song.beatsPerBar * 4;
  const playheadRef = usePlayhead(getPlayheadTicks, stepW);
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeTrack = song.tracks.find(track => track.id === activeTrackId);
  const isDrumTrack = activeTrack?.instrument === 'noise-perc';
  const centerPitch = isDrumTrack
    ? (activeTrack?.notes.length ? Math.round(activeTrack.notes.reduce((total, note) => total + note.pitch, 0) / activeTrack.notes.length) : 42)
    : activeTrack?.notes.length
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

  const { onGridPointerDown, onGridPointerUp, onGridPointerCancel } = usePianoRollPointer({
    hasActiveTrack,
    mode,
    steps,
    stepW,
    rowH,
    drawDuration,
    onRange,
    onAddNote,
  });

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
          <PianoRollGutter
            height={height}
            rowH={rowH}
            pitches={pitches}
            isDrumTrack={isDrumTrack}
            scale={scale}
          />

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
              <PianoRollTracks
                song={song}
                activeTrackId={activeTrackId}
                selectedNoteId={selectedNoteId}
                stepW={stepW}
                rowH={rowH}
                showGhostNotes={showGhostNotes}
                onActivateTrack={onActivateTrack}
                onSelectNote={onSelectNote}
                onChangeNote={onChangeNote}
                onDeleteNote={onDeleteNote}
              />
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
