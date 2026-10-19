import type { ScopePoint } from '../../components/instruments/plotGeometry';

export const I2S_SLOT_BITS = [16, 24, 32] as const;

/** Stereo bus clocks, independent of the number of audio channels consumed by a DAC.
 * Slot width is distinct from sample precision. NXP UM11732 §3.2:
 * https://www.nxp.com/docs/en/user-manual/UM11732.pdf
 */
export function i2sClockModel(sampleRate: number, slotBits: number) {
  if (!Number.isFinite(sampleRate) || sampleRate <= 0 || !I2S_SLOT_BITS.some((bits) => bits === slotBits)) return null;
  if (!Number.isFinite(sampleRate * slotBits * 2) || !Number.isFinite(1 / sampleRate)) return null;
  return { sampleRate, slotBits, bclk: sampleRate * slotBits * 2, duration: 1 / sampleRate };
}

/** Audio payload and nominal MCLK sit on the same two-slot bus, even for mono audio. */
export function i2sBusModel(sampleRate: number, slotBits: number, bitDepth: number, channels: number, mclkMultiplier: number) {
  const clock = i2sClockModel(sampleRate, slotBits);
  if (!clock || ![8, 16, 24, 32].includes(bitDepth) || bitDepth > slotBits || ![1, 2].includes(channels)
    || !Number.isInteger(mclkMultiplier) || mclkMultiplier <= 0) return null;
  const mclk = sampleRate * mclkMultiplier;
  const payloadBitRateMbps = sampleRate * bitDepth * channels / 1e6;
  if (![mclk, payloadBitRateMbps].every(Number.isFinite)) return null;
  return { ...clock, bitDepth, channels, mclkMultiplier, mclk, bitRateMbps: clock.bclk / 1e6, payloadBitRateMbps };
}

/** Exact ideal edges, not sampled/aliased ramps. Starts low, rises halfway through a cycle. */
export function squareClock(frequency: number, duration: number, offset: number, base = 0): ScopePoint[] {
  if (![frequency, duration, offset, base].every(Number.isFinite) || frequency <= 0 || duration <= 0) return [];
  const halfPeriod = 0.5 / frequency;
  const firstHalf = Math.floor(offset / halfPeriod + 1e-9);
  let level = ((firstHalf % 2) + 2) % 2;
  const points: ScopePoint[] = [[0, base + level]];
  const edges = Math.min(4096, Math.ceil(duration / halfPeriod) + 1);
  for (let i = 1; i <= edges; i++) {
    const time = (firstHalf + i) * halfPeriod - offset;
    if (time > duration + halfPeriod * 1e-9) break;
    const bounded = Math.max(0, Math.min(duration, time));
    points.push([bounded, base + level]);
    level = 1 - level;
    points.push([bounded, base + level]);
  }
  points.push([duration, base + level]);
  return points;
}

export function i2sClockSamples(model: NonNullable<ReturnType<typeof i2sClockModel>>, animationSeconds: number) {
  // Display one frame, with a deliberately slowed animation independent of fs.
  const offset = (animationSeconds * 0.15 % 1) * model.duration;
  return {
    bclk: squareClock(model.bclk, model.duration, offset, 2),
    ws: squareClock(model.sampleRate, model.duration, offset),
  };
}
