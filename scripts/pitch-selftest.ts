/**
 * Self-test for the pitch detection core. Generates synthetic sine buffers and
 * verifies the parabolic-interpolated frequency lands within 2 cents, that a
 * pure tone reads as highly clear, and that noise / silence / out-of-range
 * signals are rejected.
 *
 * Run: node --experimental-strip-types scripts/pitch-selftest.ts
 */
import { detectPitch } from '../lib/workbench/pitch.ts';

let failures = 0;

function ok(name: string, pass: boolean, detail?: string) {
  if (!pass) {
    failures++;
    console.error(`✗ ${name}${detail ? `: ${detail}` : ''}`);
  } else {
    console.log(`✓ ${name}`);
  }
}

const SR = 48000;
const N = 4096;

function sine(freq: number, sr: number, n: number): Float32Array {
  const buf = new Float32Array(n);
  for (let i = 0; i < n; i += 1) {
    buf[i] = Math.sin((2 * Math.PI * freq * i) / sr);
  }
  return buf;
}

function centsOff(got: number, want: number): number {
  return 1200 * Math.log2(got / want);
}

// Accuracy: parabolic interpolation should hold within 2 cents, including the
// high note where integer-offset autocorrelation would not.
for (const f of [110, 220, 440, 659.25]) {
  const result = detectPitch(sine(f, SR, N), SR);
  if (result === null) {
    ok(`detect ${f}Hz`, false, 'got null');
    continue;
  }
  const cents = centsOff(result.frequency, f);
  ok(
    `detect ${f}Hz within 2 cents`,
    Math.abs(cents) < 2,
    `freq=${result.frequency.toFixed(4)} cents=${cents.toFixed(4)}`,
  );
}

// A pure sine should read as highly clear.
const pure = detectPitch(sine(440, SR, N), SR);
ok(
  'pure sine clarity > 0.9',
  pure !== null && pure.clarity > 0.9,
  pure ? `clarity=${pure.clarity.toFixed(4)}` : 'got null',
);

// Random noise: must be rejected (null) or read as low-clarity.
const noise = new Float32Array(N);
for (let i = 0; i < N; i += 1) {
  noise[i] = Math.random() * 2 - 1;
}
const noiseResult = detectPitch(noise, SR);
ok(
  'random noise rejected or low clarity',
  noiseResult === null || noiseResult.clarity < 0.9,
  noiseResult ? `clarity=${noiseResult.clarity.toFixed(4)}` : 'null',
);

// Silence (all zeros): RMS gate must reject it.
const silence = new Float32Array(N);
const silenceResult = detectPitch(silence, SR);
ok('silence rejected (null)', silenceResult === null);

// Out-of-range: a 440Hz tone must not be detected within 50..200Hz.
const ranged = detectPitch(sine(440, SR, N), SR, { minHz: 50, maxHz: 200 });
ok('440Hz out of 50..200Hz range is null', ranged === null);

if (failures > 0) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log('\nAll pitch self-tests passed');
