/**
 * Self-test for the Encoder/Decoder tool logic (pure, sync).
 *
 * Run: node --experimental-strip-types scripts/encoder-selftest.ts
 */
import { ENCODER_MODES, decode, encode, isEncoderMode } from '../lib/workbench/encoder.ts';

let failures = 0;

function eq(name: string, got: unknown, want: unknown) {
  if (got !== want) {
    failures++;
    console.error(`✗ ${name}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
  } else {
    console.log(`✓ ${name}`);
  }
}

// Known vectors
eq('base64 encode', encode('base64', 'hello'), 'aGVsbG8=');
eq('hex encode AB', encode('hex', 'AB'), '4142');
eq('url encode', encode('url', 'a b&c'), 'a%20b%26c');
eq('base64url no padding', encode('base64url', '>>>'), 'Pj4-');
eq('base64 decode', (decode('base64', 'aGVsbG8=') as { value: string }).value, 'hello');
eq('base64url decode', (decode('base64url', 'Pj4-') as { value: string }).value, '>>>');
eq('hex decode', (decode('hex', '4142') as { value: string }).value, 'AB');
eq('url decode', (decode('url', 'a%20b%26c') as { value: string }).value, 'a b&c');

// Invalid input -> ok:false
eq('bad hex rejected', decode('hex', 'zz').ok, false);
eq('odd hex rejected', decode('hex', 'abc').ok, false);

eq('isEncoderMode ok', isEncoderMode('base64url'), true);
eq('isEncoderMode bad', isEncoderMode('rot13'), false);

// UTF-8 round-trip (incl. emoji) for every mode
const sample = 'Olá — HIOS 👋 ñ ©';
for (const m of ENCODER_MODES) {
  const r = decode(m, encode(m, sample));
  eq(`roundtrip ${m}`, r.ok && r.value, sample);
}

if (failures > 0) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log('\nAll encoder self-tests passed');
