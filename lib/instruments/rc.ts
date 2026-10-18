import type { ScopePoint } from '../../components/instruments/plotGeometry';

/** Ideal unloaded RC low-pass. C is entered in nF, amplitude is peak volts. */
export function rcTransfer(rOhm: number, cNanoF: number, frequencyHz: number) {
  if (![rOhm, cNanoF, frequencyHz].every((v) => Number.isFinite(v) && v > 0)) return null;
  const tau = rOhm * cNanoF * 1e-9;
  const ratio = 2 * Math.PI * frequencyHz * tau;
  if (!Number.isFinite(ratio) || tau <= 0) return null;
  return { gain: 1 / Math.hypot(1, ratio), phase: -Math.atan(ratio), cutoff: 1 / (2 * Math.PI * tau) };
}

export function rcSineModel(rOhm: number, cNanoF: number, frequencyHz: number, peakVolts: number) {
  const transfer = rcTransfer(rOhm, cNanoF, frequencyHz);
  if (!transfer || !Number.isFinite(peakVolts * 1.2) || peakVolts <= 0 || !Number.isFinite(3 / frequencyHz)) return null;
  return { ...transfer, frequencyHz, peakVolts, duration: 3 / frequencyHz };
}

/** Steady state only: changing R/C is not a transient circuit simulation. */
export function rcSineSamples(model: NonNullable<ReturnType<typeof rcSineModel>>, animationPhase: number) {
  const input: ScopePoint[] = [], output: ScopePoint[] = [];
  for (let i = 0; i <= 480; i++) {
    const time = model.duration * i / 480;
    const angle = 2 * Math.PI * model.frequencyHz * time - animationPhase;
    input.push([time, model.peakVolts * Math.sin(angle)]);
    output.push([time, model.peakVolts * model.gain * Math.sin(angle + model.phase)]);
  }
  return { input, output };
}
