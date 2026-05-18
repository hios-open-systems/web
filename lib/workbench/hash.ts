/**
 * Cryptographic digests, fully client-side via Web Crypto (SubtleCrypto).
 * Pure helpers are sync and unit-tested; `digest` is async (crypto.subtle).
 */

export const HASH_ALGORITHMS = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'] as const;
export type HashAlgorithm = (typeof HASH_ALGORITHMS)[number];

export function isHashAlgorithm(value: string): value is HashAlgorithm {
  return (HASH_ALGORITHMS as readonly string[]).includes(value);
}

export function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer), (b) => b.toString(16).padStart(2, '0')).join('');
}

export function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export interface DigestResult {
  hex: string;
  base64: string;
}

export async function digest(algorithm: HashAlgorithm, input: string): Promise<DigestResult> {
  const data = new TextEncoder().encode(input);
  const buffer = await crypto.subtle.digest(algorithm, data);
  return { hex: bufferToHex(buffer), base64: bufferToBase64(buffer) };
}
