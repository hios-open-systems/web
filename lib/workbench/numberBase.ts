const BIGINT_0 = BigInt(0);
const BIGINT_1 = BigInt(1);


// ── Number parsing ────────────────────────────────────────────────────────────

export type Base = 2 | 8 | 10 | 16;

interface Parsed {
  valid: boolean;
  value?: bigint;
  error?: string;
}

export function parseAny(raw: string, base: Base): Parsed {
  let clean = raw.trim().replace(/[\s_]/g, '');
  if (!clean) return { valid: false };
  const negative = clean.startsWith('-');
  clean = clean.replace(/^[+-]/, '');
  const prefix = base === 16 ? /^0x/i : base === 8 ? /^0o/i : base === 2 ? /^0b/i : null;
  if (prefix) clean = clean.replace(prefix, '');
  if (!clean || !(base === 16 ? /^[0-9a-f]+$/i : base === 8 ? /^[0-7]+$/ : base === 2 ? /^[01]+$/ : /^\d+$/).test(clean)) return { valid: false, error: 'invalid' };
  try {
    const v =
      base === 16 ? BigInt(`0x${clean}`) :
      base === 8  ? BigInt(`0o${clean}`) :
      base === 2  ? BigInt(`0b${clean}`) :
      BigInt(clean);
    return { valid: true, value: negative ? -v : v };
  } catch {
    return { valid: false, error: 'Invalid value for this base' };
  }
}

export function toBase(v: bigint, base: Base): string {
  if (v < BIGINT_0) return '-' + (-v).toString(base).toUpperCase();
  return v.toString(base).toUpperCase();
}

export function formatBin(v: bigint): string {
  if (v === BIGINT_0) return '0';
  if (v < BIGINT_0) return '-' + formatBin(-v);
  const raw = v.toString(2);
  const padded = raw.padStart(Math.ceil(raw.length / 8) * 8, '0');
  return padded.match(/.{1,8}/g)?.join(' ') ?? padded;
}

export function bitWidth(v: bigint): number {
  if (v === BIGINT_0) return 8;
  const len = (v < BIGINT_0 ? -v : v).toString(2).length;
  if (len <= 8) return 8;
  if (len <= 16) return 16;
  if (len <= 32) return 32;
  return Math.ceil(len / 8) * 8;
}

export function isPow2(v: bigint): boolean {
  return v > BIGINT_0 && (v & (v - BIGINT_1)) === BIGINT_0;
}

export function countSetBits(v: bigint): number {
  return v.toString(2).split('1').length - 1;
}


export const BASES: { base: Base; label: string; prefix: string }[] = [
  { base: 10, label: 'Decimal', prefix: '' },
  { base: 16, label: 'Hex',     prefix: '0x' },
  { base: 2,  label: 'Binary',  prefix: '0b' },
  { base: 8,  label: 'Octal',   prefix: '0o' },
];
