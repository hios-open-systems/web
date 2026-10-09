import type { RandomStringOptions } from '../workbench/random';
export function parseRandomOptions(text: string): RandomStringOptions | null {
  try {
    const value = JSON.parse(text) as Record<string, unknown>;
    const flags = ['uppercase', 'lowercase', 'numbers', 'symbols', 'excludeAmbiguous'] as const;
    if (!value || typeof value !== 'object' || !flags.every(key => typeof value[key] === 'boolean')
      || typeof value.length !== 'number' || !Number.isInteger(value.length) || value.length < 1 || value.length > 1024) return null;
    return { length: value.length, uppercase: !!value.uppercase, lowercase: !!value.lowercase, numbers: !!value.numbers, symbols: !!value.symbols, excludeAmbiguous: !!value.excludeAmbiguous };
  } catch { return null; }
}
export function parseOhms(text: string): Record<'v' | 'i' | 'r' | 'p', number | null> | null {
  try {
    const value = JSON.parse(text) as Record<string, unknown>;
    const keys = ['v', 'i', 'r', 'p'] as const;
    if (!value || !keys.every(key => value[key] === null || (typeof value[key] === 'number' && Number.isFinite(value[key])))) return null;
    return Object.fromEntries(keys.map(key => [key, value[key]])) as Record<typeof keys[number], number | null>;
  } catch { return null; }
}
