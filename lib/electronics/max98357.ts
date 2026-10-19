import { dividerRange } from './divider.ts';
import { parallelResistance, preferredCandidates, resistorRange } from './resistors.ts';

// MAX98357A/B Rev. 16, Electrical Characteristics and SD_MODE Control, pp. 7/17.
// https://www.analog.com/media/en/technical-documentation/data-sheets/MAX98357A-MAX98357B.pdf
export const MAX_SD = {
  pulldown: 100_000, pulldownTolerance: 8,
  off: { min: 0.08, typical: 0.16, max: 0.355 },
  mono: { min: 0.65, typical: 0.77, max: 0.825 },
  right: { min: 1.245, typical: 1.4, max: 1.5 },
} as const;
export type SdChannel = 'off' | 'mono' | 'right' | 'left';
export interface SdConfig {
  supply: number;
  external: number | null;
  onboard: number | null;
  tolerancePct: number;
}

export function nominalSdChannel(voltage: number): SdChannel {
  if (voltage < MAX_SD.off.typical) return 'off';
  if (voltage < MAX_SD.mono.typical) return 'mono';
  if (voltage < MAX_SD.right.typical) return 'right';
  return 'left';
}

function stableChannel(min: number, max: number): SdChannel | null {
  if (max < MAX_SD.off.min) return 'off';
  if (min > MAX_SD.off.max && max < MAX_SD.mono.min) return 'mono';
  if (min > MAX_SD.mono.max && max < MAX_SD.right.min) return 'right';
  if (min > MAX_SD.right.max) return 'left';
  return null;
}

export function max98357Sd({ supply, external, onboard, tolerancePct }: SdConfig) {
  if (!Number.isFinite(supply) || supply < 2.5 || supply > 5.5) return null;
  if (!resistorRange(1, tolerancePct)) return null;
  if ([external, onboard].some((r) => r !== null && !resistorRange(r, tolerancePct))) return null;
  const top = parallelResistance(external, onboard);
  const voltage = top === null ? { nominal: 0, min: 0, max: 0 }
    : dividerRange(supply, top, MAX_SD.pulldown, tolerancePct, MAX_SD.pulldownTolerance);
  if (!voltage) return null;
  return { voltage, nominalChannel: nominalSdChannel(voltage.nominal), stableChannel: stableChannel(voltage.min, voltage.max) };
}

/** External E24 resistor targeting the datasheet's Right-channel operating point. */
export function rightChannelResistor(supply: number, onboard: number | null, tolerancePct = 5) {
  if (onboard !== null && (!Number.isFinite(onboard) || onboard <= 0)) return null;
  const target = (94 * supply - 100) * 1000;
  const external = onboard === null ? target : 1 / (1 / target - 1 / onboard);
  // The nearest value may fail the tolerance window while a neighbour is valid.
  const candidates = preferredCandidates(external).filter((resistance) =>
    max98357Sd({ supply, onboard, external: resistance, tolerancePct })?.stableChannel === 'right');
  return candidates.reduce<number | null>((best, resistance) =>
    best === null || Math.abs(resistance - external) < Math.abs(best - external) ? resistance : best, null);
}

export const MAX_SD_EXAMPLE = { supply: 5, onboard: null, tolerancePct: 5 } as const;
export const MAX_SD_RIGHT_RESISTOR = rightChannelResistor(5, null)!;
export const MAX_SD_EXAMPLE_VALUES = {
  resistance: MAX_SD_RIGHT_RESISTOR / 1000,
  voltage: max98357Sd({ ...MAX_SD_EXAMPLE, external: MAX_SD_RIGHT_RESISTOR })!.voltage.nominal.toFixed(2),
  min: MAX_SD.mono.max, max: MAX_SD.right.min,
};
