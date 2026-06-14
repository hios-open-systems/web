/**
 * Ohm's law / power solver. Given exactly two of the four DC quantities
 * (V, I, R, P), derive the remaining two from V=I·R, P=V·I, P=I²·R, P=V²/R.
 * Pure and fully client-side; no Node-only APIs.
 */

export interface OhmsValues {
  v: number;
  i: number;
  r: number;
  p: number;
}

export type OhmsInput = Partial<OhmsValues>;

const FIELDS = ['v', 'i', 'r', 'p'] as const;

/** Round to 6 significant digits while keeping clean integers exact. */
function round6(value: number): number {
  if (!Number.isFinite(value)) {
    return value;
  }
  if (value === 0) {
    return 0;
  }
  const rounded = Number(value.toPrecision(6));
  return Object.is(rounded, -0) ? 0 : rounded;
}

function clean(values: OhmsValues): OhmsValues {
  return {
    v: round6(values.v),
    i: round6(values.i),
    r: round6(values.r),
    p: round6(values.p),
  };
}

function finalize(values: OhmsValues): OhmsValues | { error: string } {
  for (const field of FIELDS) {
    if (!Number.isFinite(values[field])) {
      return { error: 'Result is not finite (check for division by zero).' };
    }
  }
  return clean(values);
}

export function solve(input: OhmsInput): OhmsValues | { error: string } {
  const provided = FIELDS.filter((field) => Number.isFinite(input[field]));

  if (provided.length !== 2) {
    return { error: `Provide exactly 2 of V, I, R, P (got ${provided.length}).` };
  }

  const v = input.v as number;
  const i = input.i as number;
  const r = input.r as number;
  const p = input.p as number;
  const has = (field: (typeof FIELDS)[number]) => provided.includes(field);

  // V & I -> R, P
  if (has('v') && has('i')) {
    if (i === 0) {
      return { error: 'Cannot derive R from V and I when I = 0 (division by zero).' };
    }
    return finalize({ v, i, r: v / i, p: v * i });
  }

  // V & R -> I, P
  if (has('v') && has('r')) {
    if (r === 0) {
      return { error: 'Cannot derive I from V and R when R = 0 (division by zero).' };
    }
    return finalize({ v, i: v / r, r, p: (v * v) / r });
  }

  // V & P -> I, R
  if (has('v') && has('p')) {
    if (v === 0) {
      return { error: 'Cannot derive I from V and P when V = 0 (division by zero).' };
    }
    const derivedI = p / v;
    if (derivedI === 0) {
      return { error: 'Cannot derive R when the derived current is 0 (division by zero).' };
    }
    return finalize({ v, i: derivedI, r: v / derivedI, p });
  }

  // I & R -> V, P
  if (has('i') && has('r')) {
    return finalize({ v: i * r, i, r, p: i * i * r });
  }

  // I & P -> V, R
  if (has('i') && has('p')) {
    if (i === 0) {
      return { error: 'Cannot derive V from I and P when I = 0 (division by zero).' };
    }
    return finalize({ v: p / i, i, r: p / (i * i), p });
  }

  // R & P -> V, I  (last remaining combination)
  if (r < 0) {
    return { error: 'Cannot derive V from R and P when R is negative (no real solution).' };
  }
  const derivedV = Math.sqrt(p * r);
  if (r === 0) {
    return { error: 'Cannot derive I from R and P when R = 0 (division by zero).' };
  }
  return finalize({ v: derivedV, i: derivedV / r, r, p });
}
