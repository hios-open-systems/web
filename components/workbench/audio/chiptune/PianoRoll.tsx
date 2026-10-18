'use client';

import { useEffect, useRef } from 'react';
import { INSTRUMENTS, TICKS_PER_STEP, loopLengthTicks } from '@/lib/workbench/chiptune';
import { usePlayhead } from './usePlayhead';
import { usePianoRollPointer } from './usePianoRollPointer';
import { PianoRollTracks } from './PianoRollTracks';
import { PianoRollGutter } from './PianoRollGutter';
import { PianoRollRuler } from './PianoRollRuler';
import { NoteLaneStrip } from './NoteLane';
import { ROW_H, STEP_W, RULER_H, PITCH_COUNT, PITCH_MAX, pitchToY } from './grid';
import styles from './chiptune.module.css';
import { ScaleRows } from './ScaleRows';
import { RollOverlays } from './RollOverlays';
import type { PianoRollProps } from './pianoRollTypes';

export function PianoRoll({
  song, activeTrackId, selectedNoteId, selectedNoteIds = [], selectedRange, loopActive = false, lane,
  zoom = 1, drawDuration = TICKS_PER_STEP * 2, mode = 'draw', showGhostNotes = false,
  onActivateTrack, onRange, onSelectNote, onChangeNote, onDeleteNote, onAddNote,
  onSeek, onLoopRegion, onChangeNotes, getPlayheadTicks, scale,
}: PianoRollProps) {
  const stepW = STEP_W * zoom;
  const rowH = ROW_H * zoom;
  const steps = song.lengthBars * song.beatsPerBar * 4;
  const width = steps * stepW;
  const height = PITCH_COUNT * rowH;
  const barWidth = stepW * song.beatsPerBar * 4;
  const playheadRef = usePlayhead(getPlayheadTicks, stepW);
  const scrollRef = useRef<HTMLDivElement>(null);
  const laneRef = useRef<HTMLDivElement>(null);
  const activeTrack = song.tracks.find(track => track.id === activeTrackId);
  const isDrumTrack = activeTrack?.instrument === 'noise-perc';
  const notes = activeTrack?.notes ?? [];
  const centerPitch = notes.length
    ? Math.round(notes.reduce((total, note) => total + note.pitch, 0) / notes.length)
    : isDrumTrack ? 42 : 60;
  const centerRef = useRef(centerPitch);
  centerRef.current = centerPitch;
  useEffect(() => {
    const scroll = scrollRef.current;
    if (scroll) scroll.scrollTop = Math.max(0, pitchToY(centerRef.current, rowH) - scroll.clientHeight / 2);
  }, [activeTrackId, rowH]);
  const hasActiveTrack = song.tracks.some((track) => track.id === activeTrackId);
  const pitches = Array.from({ length: PITCH_COUNT }, (_, i) => PITCH_MAX - i);

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

  const region = song.loopRegion;

  return (
    <div className={styles.roll}>
      <div
        className={styles.rollScroll}
        ref={scrollRef}
        aria-label="Piano roll"
        tabIndex={0}
        onScroll={(event) => {
          if (laneRef.current) laneRef.current.scrollLeft = event.currentTarget.scrollLeft;
        }}
      >
        <div className={styles.rollInner} style={{ height: height + RULER_H }}>
          <PianoRollGutter
            height={height}
            rowH={rowH}
            pitches={pitches}
            isDrumTrack={isDrumTrack}
            scale={scale}
          />

          <div className={styles.rollGridWrap} style={{ width }}>
            <PianoRollRuler
              width={width}
              stepW={stepW}
              bars={song.lengthBars}
              barWidth={barWidth}
              ppq={song.ppq}
              songTicks={loopLengthTicks(song)}
              loopRegion={region}
              loopActive={loopActive}
              onSeek={onSeek}
              onLoopRegion={onLoopRegion}
            />

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
                selectedNoteIds={selectedNoteIds}
                stepW={stepW}
                rowH={rowH}
                showGhostNotes={showGhostNotes}
                onActivateTrack={onActivateTrack}
                onSelectNote={onSelectNote}
                onChangeNote={onChangeNote}
                onDeleteNote={onDeleteNote}
              />
              <RollOverlays
                range={selectedRange}
                loop={loopActive ? region : undefined}
                stepW={stepW}
                height={height}
              />
              <div ref={playheadRef} className={styles.playhead} style={{ height }} />
            </div>
          </div>
        </div>
      </div>
      {lane && activeTrack && onChangeNotes && (
        <NoteLaneStrip
          ref={laneRef}
          onScrollX={(left) => {
            if (scrollRef.current) scrollRef.current.scrollLeft = left;
          }}
          kind={lane}
          notes={activeTrack.notes}
          selectedIds={selectedNoteIds.length > 1 ? selectedNoteIds : []}
          color={INSTRUMENTS[activeTrack.instrument].color}
          stepW={stepW}
          width={width}
          onChangeNotes={onChangeNotes}
        />
      )}
    </div>
  );
}
