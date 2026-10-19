import { preferredResistance, type PreferredSeries } from './resistors.ts';

/** Nominal DC calculation; LED forward-voltage and resistor tolerances are excluded. */
export function ledRecommendation(supply: number, forwardVoltage: number, currentMa: number, series: PreferredSeries) {
  if (![supply, forwardVoltage, currentMa].every(Number.isFinite) || forwardVoltage < 0 || supply <= forwardVoltage || currentMa <= 0) return null;
  const drop = supply - forwardVoltage;
  const ideal = drop / (currentMa / 1000);
  const resistance = preferredResistance(ideal, series, 'up');
  if (resistance === null) return null;
  const current = drop / resistance;
  return { ideal, resistance, currentMa: current * 1000, power: drop * current };
}
