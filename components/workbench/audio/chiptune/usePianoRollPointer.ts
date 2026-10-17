'use client';

import { useRef, type PointerEvent as ReactPointerEvent } from 'react';
import { TICKS_PER_STEP, clamp, createNote, type ChiptuneNote } from '@/lib/workbench/chiptune';
import { PITCH_MIN, PITCH_MAX, xToStep, yToPitch } from './grid';

interface PointerHookOptions {
  hasActiveTrack: boolean;
  mode: 'draw' | 'select';
  steps: number;
  stepW: number;
  rowH: number;
  drawDuration: number;
  onRange?: (range: { startTick: number; endTick: number } | null) => void;
  onAddNote: (note: ChiptuneNote) => void;
}

export function usePianoRollPointer({
  hasActiveTrack,
  mode,
  steps,
  stepW,
  rowH,
  drawDuration,
  onRange,
  onAddNote,
}: PointerHookOptions) {
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
    if (Math.abs(event.clientX - tap.x) > 6 || Math.abs(event.clientY - tap.y) > 6) {
      if (onRange && mode === 'select') {
        const a = xToStep(Math.min(tap.x, event.clientX) - rect.left, stepW) * TICKS_PER_STEP;
        const b = xToStep(Math.max(tap.x, event.clientX) - rect.left, stepW) * TICKS_PER_STEP;
        onRange(b > a ? { startTick: Math.min(a, steps * TICKS_PER_STEP), endTick: Math.min(b, steps * TICKS_PER_STEP) } : null);
      }
      return;
    }
    if (mode === 'select') {
      onRange?.(null);
      return;
    }
    const step = clamp(Math.floor((event.clientX - rect.left) / stepW), 0, steps - 1);
    const pitch = clamp(yToPitch(event.clientY - rect.top, rowH), PITCH_MIN, PITCH_MAX);
    onAddNote(createNote(pitch, step * TICKS_PER_STEP, Math.min(drawDuration, (steps - step) * TICKS_PER_STEP)));
  };

  const onGridPointerCancel = () => {
    tapRef.current = null;
  };

  return { onGridPointerDown, onGridPointerUp, onGridPointerCancel };
}
