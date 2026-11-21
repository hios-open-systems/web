import { butterworthLossDb } from './physics.ts';

/** Harmonic powers relative to the carrier after both pass through the filter. */
export function filteredHarmonicsDbc(
  inputDbc: readonly number[],
  fundamentalHz: number,
  cutoffHz: number,
  order: number,
): number[] {
  const carrierLoss = butterworthLossDb(fundamentalHz, cutoffHz, order);
  return inputDbc.map((level, index) =>
    level - butterworthLossDb(fundamentalHz * (index + 1), cutoffHz, order) + carrierLoss,
  );
}
