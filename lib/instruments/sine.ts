import type { ScopePoint } from '../../components/instruments/plotGeometry';

export interface SineTransfer { gain: number; phase: number; }
export interface SineModel extends SineTransfer { frequencyHz: number; peakVolts: number; duration: number; }

export function sineModel<T extends SineTransfer>(transfer: T | null, frequencyHz: number, peakVolts: number) {
  if (!transfer || ![frequencyHz, peakVolts].every((v) => Number.isFinite(v) && v > 0)
    || !Number.isFinite(peakVolts * 1.2) || !Number.isFinite(3 / frequencyHz)
    || !Number.isFinite(transfer.gain) || transfer.gain < 0 || !Number.isFinite(transfer.phase)) return null;
  return { ...transfer, frequencyHz, peakVolts, duration: 3 / frequencyHz };
}

/** Sinusoidal steady state; the visual phase never changes the physical frequency or phase lag. */
export function sineSamples(model: SineModel, animationPhase: number) {
  const input: ScopePoint[] = [], output: ScopePoint[] = [];
  for (let i = 0; i <= 480; i++) {
    const time = model.duration * i / 480;
    const angle = 2 * Math.PI * 3 * i / 480 - animationPhase;
    input.push([time, model.peakVolts * Math.sin(angle)]);
    output.push([time, model.peakVolts * model.gain * Math.sin(angle + model.phase)]);
  }
  return { input, output };
}
