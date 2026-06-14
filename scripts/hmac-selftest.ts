/**
 * Self-test for the HMAC tool logic. The async SubtleCrypto HMAC against
 * known vectors plus the algorithm guard.
 *
 * Run: node --experimental-strip-types scripts/hmac-selftest.ts
 */
import { hmac, isHmacAlgorithm } from '../lib/workbench/hmac.ts';

let failures = 0;

function eq(name: string, got: unknown, want: unknown) {
  if (got !== want) {
    failures++;
    console.error(`✗ ${name}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
  } else {
    console.log(`✓ ${name}`);
  }
}

// Algorithm guard
eq('isHmacAlgorithm SHA-256', isHmacAlgorithm('SHA-256'), true);
eq('isHmacAlgorithm garbage', isHmacAlgorithm('MD5'), false);

// Async HMAC against published vectors (key='key', the quick brown fox...)
const message = 'The quick brown fox jumps over the lazy dog';

const r1 = await hmac('SHA-256', 'key', message);
eq('HMAC-SHA-256 fox', r1.hex, 'f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8');

const r2 = await hmac('SHA-1', 'key', message);
eq('HMAC-SHA-1 fox', r2.hex, 'de7c9b85b8b78aa6bc8a7a36f70a90701c9db4d9');

eq('HMAC-SHA-256 base64 non-empty', r1.base64.length > 0, true);

if (failures > 0) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log('\nAll HMAC self-tests passed');
