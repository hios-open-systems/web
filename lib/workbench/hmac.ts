/**
 * HMAC signatures, fully client-side via Web Crypto (SubtleCrypto).
 * Self-contained: inlines its own hex/base64 helpers so it can be imported
 * without an explicit `.ts` extension (which would break the build).
 */

export const HMAC_ALGORITHMS = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'] as const;
export type HmacAlgorithm = (typeof HMAC_ALGORITHMS)[number];

export function isHmacAlgorithm(value: string): value is HmacAlgorithm {
  return (HMAC_ALGORITHMS as readonly string[]).includes(value);
}

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer), (b) => b.toString(16).padStart(2, '0')).join('');
}

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export interface HmacResult {
  hex: string;
  base64: string;
}

export async function hmac(
  algorithm: HmacAlgorithm,
  key: string,
  message: string,
): Promise<HmacResult> {
  const encoder = new TextEncoder();
  const keyBytes = encoder.encode(key);
  const msgBytes = encoder.encode(message);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'HMAC', hash: algorithm },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, msgBytes);
  return { hex: bufferToHex(signature), base64: bufferToBase64(signature) };
}
