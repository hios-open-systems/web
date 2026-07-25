/** Pixel geometry for the piano-roll grid. Pure helpers shared by the roll and notes.
 *  Los helpers aceptan stepW/rowH escalados (zoom); por defecto usan la base. */
import { TICKS_PER_STEP } from '@/lib/workbench/chiptune';

export const ROW_H = 18; // px por semitono (base, zoom 1)
export const STEP_W = 22; // px por semicorchea (base, zoom 1)
export const RULER_H = 18; // alto de la regla de compases
export const PITCH_MIN = 36; // C2
export const PITCH_MAX = 84; // C6
export const PITCH_COUNT = PITCH_MAX - PITCH_MIN + 1;

export const pitchToY = (pitch: number, rowH: number = ROW_H): number => (PITCH_MAX - pitch) * rowH;
export const yToPitch = (y: number, rowH: number = ROW_H): number => PITCH_MAX - Math.floor(y / rowH);
export const tickToX = (tick: number, stepW: number = STEP_W): number => (tick / TICKS_PER_STEP) * stepW;
export const xToStep = (x: number, stepW: number = STEP_W): number => Math.max(0, Math.round(x / stepW));
export const durToWidth = (duration: number, stepW: number = STEP_W): number => (duration / TICKS_PER_STEP) * stepW;
