import { preferredResistance, resistorRange, type PreferredSeries } from './resistors.ts';

/** Unloaded DC divider. Supply voltage is assumed exact; tolerances are independent. */
export function dividerVoltage(vin: number, top: number, bottom: number) {
  if (![vin, top, bottom].every(Number.isFinite) || vin < 0 || top < 0 || bottom <= 0) return null;
  return vin / (1 + top / bottom);
}

export function dividerRange(vin: number, top: number, bottom: number, topTolerance = 0, bottomTolerance = topTolerance) {
  const upper = resistorRange(top, topTolerance), lower = resistorRange(bottom, bottomTolerance);
  if (!upper || !lower || lower.min <= 0) return null;
  const nominal = dividerVoltage(vin, top, bottom);
  const min = dividerVoltage(vin, upper.max, lower.min), max = dividerVoltage(vin, upper.min, lower.max);
  return nominal === null || min === null || max === null ? null : { nominal, min, max };
}

export function dividerTop(vin: number, target: number, bottom: number) {
  if (![vin, target, bottom].every(Number.isFinite) || target <= 0 || vin <= target || bottom <= 0) return null;
  const result = bottom * (vin / target - 1);
  return Number.isFinite(result) ? result : null;
}

/** Round upwards after accounting for worst-case resistor tolerances. */
export function adcRecommendation(vin: number, limit: number, bottom: number, tolerancePct: number, series: PreferredSeries) {
  const ideal = dividerTop(vin, limit, bottom), range = resistorRange(bottom, tolerancePct);
  if (ideal === null || !range) return null;
  const required = ideal * (1 + tolerancePct / 100) / (1 - tolerancePct / 100);
  const resistance = preferredResistance(required, series, 'up');
  if (resistance === null) return null;
  const voltage = dividerRange(vin, resistance, bottom, tolerancePct);
  return voltage ? { ideal, resistance, voltage } : null;
}
