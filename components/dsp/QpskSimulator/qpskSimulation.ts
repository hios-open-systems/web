import type { Dibit, Point2D, QpskSimConfig } from './types';
import { gaussianRandom, mapDibit } from './qpskMath.ts';

export interface SymbolNoise {
  symbolIndex: number;
  I: number;
  Q: number;
}

export interface SimulationState {
  timeOffset: number;
  sampleClock: number;
  noise: SymbolNoise[];
}

export const HISTORY_LIMIT = 240;

export function createSimulationState(): SimulationState {
  return { timeOffset: 0, sampleClock: 0, noise: [] };
}

function acquire(state: SimulationState, count: number, gaussian: () => number): void {
  for (let symbolIndex = 0; symbolIndex < count; symbolIndex++) {
    state.noise.push({ symbolIndex, I: gaussian(), Q: gaussian() });
  }
  state.noise.splice(0, Math.max(0, state.noise.length - HISTORY_LIMIT));
}

/** Freeze both phase and random samples at zero speed or pause, independent of frame rate. */
export function stepSimulation(
  state: SimulationState, config: QpskSimConfig, seconds: number,
  gaussian: () => number = gaussianRandom,
): void {
  if (config.dibits.length === 0) return;
  if (state.noise.length === 0) acquire(state, config.dibits.length, gaussian);
  if (!config.running || config.scrollSpeed === 0) return;
  const elapsed = Math.min(0.1, Math.max(0, seconds)) * config.scrollSpeed;
  state.timeOffset = (state.timeOffset + 1.8 * elapsed) % (2 * Math.PI);
  state.sampleClock += elapsed * 30;
  const batches = Math.floor(state.sampleClock + 1e-10);
  state.sampleClock -= batches;
  for (let i = 0; i < batches; i++) acquire(state, config.dibits.length, gaussian);
}

/** Re-evaluate edited controls against the same frozen standard-normal samples. */
export function constellationSamples(noise: SymbolNoise[], dibits: Dibit[], sigma: number): Point2D[] {
  if (dibits.length === 0) return [];
  return noise.map((sample) => {
    const { I, Q } = mapDibit(dibits[sample.symbolIndex % dibits.length]);
    return { x: I * Math.SQRT1_2 + sigma * sample.I, y: Q * Math.SQRT1_2 + sigma * sample.Q };
  });
}

/** Only the renderer knows pixels: resizing cannot move samples in I/Q space. */
export function projectPoint(point: Point2D, width: number, height: number): Point2D {
  const radius = Math.min(width, height) * 0.35;
  return { x: width / 2 + point.x * radius, y: height / 2 - point.y * radius };
}
