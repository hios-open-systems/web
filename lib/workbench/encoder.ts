/**
 * Text encoders/decoders, fully client-side and sync. UTF-8 safe via
 * TextEncoder/TextDecoder. Decoding can fail on malformed input, so it
 * returns a discriminated result instead of throwing.
 */

export const ENCODER_MODES = ['base64', 'base64url', 'hex', 'url'] as const;
export type EncoderMode = (typeof ENCODER_MODES)[number];

export function isEncoderMode(value: string): value is EncoderMode {
  return (ENCODER_MODES as readonly string[]).includes(value);
}

export type DecodeResult = { ok: true; value: string } | { ok: false; error: string };

function utf8ToBytes(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

function bytesToUtf8(bytes: Uint8Array): string {
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}

function bytesToBinary(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
  return binary;
}

function binaryToBytes(binary: string): Uint8Array {
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) out[i] = binary.charCodeAt(i);
  return out;
}

export function encode(mode: EncoderMode, text: string): string {
  if (mode === 'url') return encodeURIComponent(text);
  const bytes = utf8ToBytes(text);
  if (mode === 'hex') {
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  }
  const b64 = btoa(bytesToBinary(bytes));
  if (mode === 'base64') return b64;
  // base64url
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decode(mode: EncoderMode, text: string): DecodeResult {
  try {
    if (mode === 'url') {
      return { ok: true, value: decodeURIComponent(text) };
    }
    if (mode === 'hex') {
      const clean = text.trim().replace(/\s+/g, '');
      if (clean.length % 2 !== 0 || /[^0-9a-fA-F]/.test(clean)) {
        return { ok: false, error: 'invalid-hex' };
      }
      const bytes = new Uint8Array(clean.length / 2);
      for (let i = 0; i < bytes.length; i += 1) {
        bytes[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
      }
      return { ok: true, value: bytesToUtf8(bytes) };
    }
    // base64 / base64url
    let b64 = text.trim();
    if (mode === 'base64url') {
      b64 = b64.replace(/-/g, '+').replace(/_/g, '/');
      while (b64.length % 4 !== 0) b64 += '=';
    }
    const bytes = binaryToBytes(atob(b64));
    return { ok: true, value: bytesToUtf8(bytes) };
  } catch {
    return { ok: false, error: 'invalid-input' };
  }
}
