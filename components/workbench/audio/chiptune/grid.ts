/** Pixel geometry for the piano-roll grid. Pure helpers shared by the roll and notes. */
import { TICKS_PER_STEP } from '@/lib/workbench/chiptune';

export const ROW_H = 18; // px per semitone row
export const STEP_W = 22; // px per 16th step
export const PITCH_MIN = 36; // C2
export const PITCH_MAX = 84; // C6
export const PITCH_COUNT = PITCH_MAX - PITCH_MIN + 1;

export const pitchToY = (pitch: number): number => (PITCH_MAX - pitch) * ROW_H;
export const yToPitch = (y: number): number => PITCH_MAX - Math.floor(y / ROW_H);
export const tickToX = (tick: number): number => (tick / TICKS_PER_STEP) * STEP_W;
export const xToStep = (x: number): number => Math.max(0, Math.round(x / STEP_W));
export const durToWidth = (duration: number): number => (duration / TICKS_PER_STEP) * STEP_W;
