import { preferredResistance, type Selection } from '../../../lib/electronics/resistors.ts';

export type ESeries = 'E12' | 'E24';
export const E_SERIES_OPTIONS: ESeries[] = ['E12', 'E24'];
export function isESeries(value: string): value is ESeries {
  return value === 'E12' || value === 'E24';
}
export function nearestStandard(value: number, series: ESeries = 'E24', mode: Selection = 'nearest'): number | null {
  return preferredResistance(value, series === 'E12' ? 'e12' : 'e24', mode);
}
