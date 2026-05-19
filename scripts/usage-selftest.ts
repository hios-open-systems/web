/**
 * Self-test for pinned/recent usage logic (pure, sync).
 *
 * Run: node --experimental-strip-types scripts/usage-selftest.ts
 */
import {
  EMPTY_USAGE,
  isPinned,
  parseUsage,
  recordUse,
  serializeUsage,
  togglePin,
} from '../lib/workbench/usage.ts';

let failures = 0;
function ok(name: string, cond: boolean) {
  if (!cond) {
    failures++;
    console.error(`✗ ${name}`);
  } else {
    console.log(`✓ ${name}`);
  }
}

let s = EMPTY_USAGE;
s = togglePin(s, 'regex');
ok('pin adds', isPinned(s, 'regex') && s.pinned.length === 1);
s = togglePin(s, 'jwt-decode');
ok('pin prepends', s.pinned[0] === 'jwt-decode');
s = togglePin(s, 'regex');
ok('toggle unpins', !isPinned(s, 'regex') && s.pinned.length === 1);

s = recordUse(s, 'hash-digest');
s = recordUse(s, 'encoder');
s = recordUse(s, 'hash-digest');
ok('recent dedupes + most-recent-first', s.recent[0] === 'hash-digest' && s.recent.length === 2);

let big = EMPTY_USAGE;
for (let i = 0; i < 20; i += 1) big = recordUse(big, `tool-${i}`);
ok('recent capped at 8', big.recent.length === 8 && big.recent[0] === 'tool-19');

const round = parseUsage(serializeUsage(s));
ok('round-trip', round.recent[0] === 'hash-digest' && round.pinned[0] === 'jwt-decode');

ok('parse null -> empty', parseUsage(null).recent.length === 0);
ok('parse garbage -> empty', parseUsage('{nope').pinned.length === 0);
ok('parse wrong version -> empty', parseUsage(JSON.stringify({ version: 9, pinned: ['x'], recent: [] })).pinned.length === 0);
ok(
  'parse non-string entries -> empty',
  parseUsage(JSON.stringify({ version: 1, pinned: [1], recent: [] })).pinned.length === 0,
);
ok('immutability: togglePin returns new object', togglePin(EMPTY_USAGE, 'a') !== EMPTY_USAGE);

if (failures > 0) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log('\nAll usage self-tests passed');
