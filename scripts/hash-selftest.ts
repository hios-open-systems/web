/**
 * Self-test for the Hash & Digest tool logic. Pure helpers + the async
 * SubtleCrypto digest against known vectors.
 *
 * Run: node --experimental-strip-types scripts/hash-selftest.ts
 */
import {
  HASH_ALGORITHMS,
  bufferToHex,
  bufferToBase64,
  digest,
  isHashAlgorithm,
} from '../lib/workbench/hash.ts';

let failures = 0;

function eq(name: string, got: unknown, want: unknown) {
  if (got !== want) {
    failures++;
    console.error(`✗ ${name}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
  } else {
    console.log(`✓ ${name}`);
  }
}

// Pure helpers
const buf = new Uint8Array([0xde, 0xad, 0xbe, 0xef]).buffer;
eq('bufferToHex', bufferToHex(buf), 'deadbeef');
eq('bufferToBase64', bufferToBase64(buf), '3q2+7w==');
eq('isHashAlgorithm SHA-256', isHashAlgorithm('SHA-256'), true);
eq('isHashAlgorithm garbage', isHashAlgorithm('MD5'), false);
eq('algorithm list', HASH_ALGORITHMS.join(','), 'SHA-1,SHA-256,SHA-384,SHA-512');

// Async digest against published vectors
const r1 = await digest('SHA-256', '');
eq('SHA-256 empty', r1.hex, 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');

const r2 = await digest('SHA-256', 'The quick brown fox jumps over the lazy dog');
eq('SHA-256 fox', r2.hex, 'd7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592');

const r3 = await digest('SHA-1', 'abc');
eq('SHA-1 abc', r3.hex, 'a9993e364706816aba3e25717850c26c9cd0d89d');

const r4 = await digest('SHA-256', 'abc');
eq('SHA-256 abc base64', r4.base64, 'ungWv48Bz+pBQUDeXa4iI7ADYaOWF3qctBD/YfIAFa0=');

if (failures > 0) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log('\nAll hash self-tests passed');
