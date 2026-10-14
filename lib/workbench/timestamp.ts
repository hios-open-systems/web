export type TimestampUnit = 'auto' | 'seconds' | 'milliseconds';
export function parseTimestamp(raw: string, unit: TimestampUnit = 'auto'): Date | null {
  const text = raw.trim();
  if (!text) return null;
  let value: Date;
  if (/^[+-]?\d+(?:\.\d+)?$/.test(text)) {
    const n = Number(text);
    const milliseconds = unit === 'milliseconds' || (unit === 'auto' && Math.abs(n) >= 100_000_000_000);
    value = new Date(milliseconds ? n : n * 1000);
  } else {
    value = new Date(text);
  }
  return Number.isNaN(value.getTime()) ? null : value;
}
