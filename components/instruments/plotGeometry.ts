export type ScopePoint = readonly [number, number];
export interface ScopeAxis {
  domain: readonly [number, number];
  label: string;
  scale?: 'linear' | 'log';
  ticks?: readonly number[];
  format?: (value: number) => string;
}

export function formatScopeValue(value: number, precision = 3): string {
  if (value === 0) return '0';
  const magnitude = Math.abs(value);
  const scales = [[1e9, 'G'], [1e6, 'M'], [1e3, 'k'], [1, ''], [1e-3, 'm'], [1e-6, 'µ'], [1e-9, 'n']] as const;
  const [scale, suffix] = scales.find(([scale]) => magnitude >= scale) ?? scales[scales.length - 1];
  return `${Number((value / scale).toPrecision(precision))}${suffix}`;
}

export function axisTransform(value: number, axis: ScopeAxis): number {
  return axis.scale === 'log' ? (value > 0 ? Math.log10(value) : NaN) : value;
}

export function axisPosition(value: number, axis: ScopeAxis, start: number, end: number): number {
  const lo = axisTransform(axis.domain[0], axis);
  const hi = axisTransform(axis.domain[1], axis);
  return start + (axisTransform(value, axis) - lo) / (hi - lo) * (end - start);
}

export function axisTicks(axis: ScopeAxis): readonly number[] {
  if (axis.ticks) return axis.ticks;
  const [lo, hi] = axis.domain;
  if (axis.scale !== 'log') return Array.from({ length: 5 }, (_, i) => lo + (hi - lo) * i / 4);
  const ticks: number[] = [];
  for (let exponent = Math.ceil(Math.log10(lo)); exponent <= Math.floor(Math.log10(hi)); exponent++) {
    ticks.push(10 ** exponent);
  }
  return ticks;
}

export function validAxis(axis: ScopeAxis): boolean {
  const [lo, hi] = axis.domain;
  return Number.isFinite(lo) && Number.isFinite(hi) && hi > lo && (axis.scale !== 'log' || lo > 0);
}

export function tracePath(points: readonly ScopePoint[], x: (v: number) => number, y: (v: number) => number): string {
  let connected = false;
  return points.map(([vx, vy]) => {
    const px = x(vx), py = y(vy);
    if (!Number.isFinite(px) || !Number.isFinite(py)) { connected = false; return ''; }
    const command = connected ? 'L' : 'M';
    connected = true;
    return `${command}${px.toFixed(2)},${py.toFixed(2)}`;
  }).join(' ');
}

export function dataDomain(points: readonly ScopePoint[], index: 0 | 1, padding = 0): [number, number] {
  const values = points.map((p) => p[index]).filter(Number.isFinite);
  if (!values.length) return [0, 1];
  const lo = Math.min(...values), hi = Math.max(...values);
  const pad = (hi - lo) * padding || (hi === lo ? Math.max(1, Math.abs(lo) * 0.08) : 0);
  return [lo - pad, hi + pad];
}
