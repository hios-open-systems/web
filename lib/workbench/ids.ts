/**
 * UUID v4 + ULID generation, client-side via Web Crypto. Pure and
 * deterministic when an explicit time / RNG is injected (for the self-test).
 */

export const ID_TYPES = ['uuid', 'ulid'] as const;
export type IdType = (typeof ID_TYPES)[number];

export function isIdType(value: string): value is IdType {
  return (ID_TYPES as readonly string[]).includes(value);
}

function randomBytes(n: number): Uint8Array {
  const out = new Uint8Array(n);
  crypto.getRandomValues(out);
  return out;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

export function uuidV4(rng: (n: number) => Uint8Array = randomBytes): string {
  if (rng === randomBytes && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  const b = rng(16);
  b[6] = (b[6] & 0x0f) | 0x40; // version 4
  b[8] = (b[8] & 0x3f) | 0x80; // variant 10
  const h = Array.from(b, (x) => x.toString(16).padStart(2, '0'));
  return `${h.slice(0, 4).join('')}-${h.slice(4, 6).join('')}-${h.slice(6, 8).join('')}-${h.slice(8, 10).join('')}-${h.slice(10, 16).join('')}`;
}

// Crockford base32 (no I, L, O, U) — the ULID alphabet.
const ENC = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const ULID_RE = /^[0-9A-HJKMNP-TV-Z]{26}$/;

export function isUlid(value: string): boolean {
  return ULID_RE.test(value);
}

function encodeTime(ms: number): string {
  let out = '';
  let t = Math.floor(ms);
  for (let i = 0; i < 10; i += 1) {
    out = ENC[t % 32] + out;
    t = Math.floor(t / 32);
  }
  return out;
}

function encodeRandom(rng: (n: number) => Uint8Array): string {
  // 16 Crockford chars = 80 bits of randomness.
  const bytes = rng(10);
  let out = '';
  for (let i = 0; i < 16; i += 1) {
    const bit = i * 5;
    const byte = bit >> 3;
    const shift = bit & 7;
    const hi = bytes[byte] ?? 0;
    const lo = bytes[byte + 1] ?? 0;
    const value = ((hi << 8) | lo) >> (11 - shift);
    out += ENC[value & 31];
  }
  return out;
}

export function ulid(
  time: number = Date.now(),
  rng: (n: number) => Uint8Array = randomBytes,
): string {
  return encodeTime(time) + encodeRandom(rng);
}

export function generateIds(type: IdType, count: number): string[] {
  const n = Math.max(1, Math.min(100, Math.floor(count)));
  const out: string[] = [];
  for (let i = 0; i < n; i += 1) {
    out.push(type === 'uuid' ? uuidV4() : ulid());
  }
  return out;
}
