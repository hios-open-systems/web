/**
 * Self-test for the Ohm's law / power solver. Exercises each two-input
 * combination plus the error guards (wrong input count, division by zero).
 *
 * Run: node --experimental-strip-types scripts/ohms-selftest.ts
 */
import { solve } from '../lib/algorithms/ohmsLaw.ts';
import type { OhmsValues } from '../lib/algorithms/ohmsLaw.ts';

let failures = 0;

function eq(name: string, got: unknown, want: unknown) {
  if (got !== want) {
    failures++;
    console.error(`✗ ${name}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
  } else {
    console.log(`✓ ${name}`);
  }
}

function isValues(result: OhmsValues | { error: string }): result is OhmsValues {
  return !('error' in result);
}

function expectValues(name: string, result: OhmsValues | { error: string }, want: OhmsValues) {
  if (!isValues(result)) {
    failures++;
    console.error(`✗ ${name}: expected values, got error ${JSON.stringify(result.error)}`);
    return;
  }
  eq(`${name}.v`, result.v, want.v);
  eq(`${name}.i`, result.i, want.i);
  eq(`${name}.r`, result.r, want.r);
  eq(`${name}.p`, result.p, want.p);
}

function expectError(name: string, result: OhmsValues | { error: string }) {
  if (isValues(result)) {
    failures++;
    console.error(`✗ ${name}: expected error, got values ${JSON.stringify(result)}`);
    return;
  }
  eq(`${name} has error`, typeof result.error, 'string');
}

// Two-input combinations derive the other two exactly.
expectValues('V & R', solve({ v: 12, r: 4 }), { v: 12, i: 3, r: 4, p: 36 });
expectValues('P & V', solve({ p: 100, v: 10 }), { v: 10, i: 10, r: 1, p: 100 });
expectValues('I & R', solve({ i: 2, r: 3 }), { v: 6, i: 2, r: 3, p: 12 });

// Error guards.
expectError('single input', solve({ v: 5 }));
expectError('three inputs', solve({ v: 1, i: 1, r: 1 }));
expectError('division by zero', solve({ p: 10, i: 0 }));

if (failures > 0) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log('\nAll ohms self-tests passed');
