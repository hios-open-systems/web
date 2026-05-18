/**
 * Self-test for the UUID/ULID tool logic (pure; deterministic with
 * injected time + RNG).
 *
 * Run: node --experimental-strip-types scripts/ids-selftest.ts
 */
import { generateIds, isIdType, isUlid, isUuid, ulid, uuidV4 } from '../lib/workbench/ids.ts';

let failures = 0;
function ok(name: string, cond: boolean) {
  if (!cond) {
    failures++;
    console.error(`✗ ${name}`);
  } else {
    console.log(`✓ ${name}`);
  }
}

const zeros = (n: number) => new Uint8Array(n);
const fill = (v: number) => (n: number) => new Uint8Array(n).fill(v);

// UUID v4: native path is a valid v4; injected RNG sets version/variant bits.
ok('uuidV4 native is valid', isUuid(uuidV4()));
const u = uuidV4(fill(0xff));
ok('uuidV4 injected is valid v4', isUuid(u));
ok('uuidV4 version nibble = 4', u[14] === '4');
ok('uuidV4 variant nibble in 89ab', '89ab'.includes(u[19]));
ok('isUuid rejects junk', !isUuid('not-a-uuid'));

// ULID: 26 chars, time-prefixed, deterministic with fixed time+rng.
const a = ulid(0, zeros);
ok('ulid length 26', a.length === 26);
ok('ulid all zeros', a === '00000000000000000000000000');
ok('isUlid accepts', isUlid(a));
ok('isUlid rejects lowercase', !isUlid(a.toLowerCase().replace(/0/g, 'l')));

// Monotonic by time prefix: later timestamp sorts after earlier.
const early = ulid(1000, zeros);
const late = ulid(2_000_000, zeros);
ok('ulid sorts by time', early < late);

ok('isIdType uuid', isIdType('uuid'));
ok('isIdType bad', !isIdType('guid'));

const batch = generateIds('uuid', 5);
ok('generateIds count', batch.length === 5 && batch.every(isUuid));
ok('generateIds clamps', generateIds('ulid', 999).length === 100);
ok('generateIds min 1', generateIds('ulid', 0).length === 1);

if (failures > 0) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log('\nAll ids self-tests passed');
