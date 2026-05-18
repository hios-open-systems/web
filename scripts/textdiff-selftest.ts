/**
 * Self-test for the Text Diff logic (pure LCS, sync).
 *
 * Run: node --experimental-strip-types scripts/textdiff-selftest.ts
 */
import { diffLines } from '../lib/workbench/textDiff.ts';

let failures = 0;
function ok(name: string, cond: boolean) {
  if (!cond) {
    failures++;
    console.error(`✗ ${name}`);
  } else {
    console.log(`✓ ${name}`);
  }
}

const r = diffLines('a\nb\nc', 'a\nx\nc');
ok('counts', r.added === 1 && r.removed === 1);
ok(
  'sequence',
  r.lines.map((l) => `${l.type}:${l.value}`).join(',') === 'eq:a,del:b,add:x,eq:c',
);
ok('line numbers', r.lines[0].a === 1 && r.lines[0].b === 1 && r.lines[2].b === 2);

const same = diffLines('one\ntwo', 'one\ntwo');
ok('identical -> 0/0', same.added === 0 && same.removed === 0);
ok('identical all eq', same.lines.every((l) => l.type === 'eq'));

const onlyAdd = diffLines('', 'new');
ok('pure add', onlyAdd.added === 1 && onlyAdd.removed === 0);

const onlyDel = diffLines('gone', '');
ok('pure del', onlyDel.removed === 1 && onlyDel.added === 0);

const appended = diffLines('a\nb', 'a\nb\nc');
ok('append keeps prefix eq', appended.lines.filter((l) => l.type === 'eq').length === 2 && appended.added === 1);

const big = diffLines(Array(5000).fill('x').join('\n'), Array(5000).fill('y').join('\n'));
ok('huge input truncates', big.truncated === true);

if (failures > 0) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log('\nAll text-diff self-tests passed');
