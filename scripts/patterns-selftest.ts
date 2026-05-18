/**
 * Self-test for the Pattern Lessons catalog (data shape). The sandboxed
 * runner is DOM/iframe-bound and covered by the smoke test.
 *
 * Run: node --experimental-strip-types scripts/patterns-selftest.ts
 */
import { LESSONS, LESSON_IDS, getLesson } from '../lib/workbench/patterns.ts';

let failures = 0;
function ok(name: string, cond: boolean) {
  if (!cond) {
    failures++;
    console.error(`✗ ${name}`);
  } else {
    console.log(`✓ ${name}`);
  }
}

ok('has lessons', LESSONS.length >= 3);
ok('unique ids', new Set(LESSON_IDS).size === LESSON_IDS.length);
ok('all have non-empty code', LESSONS.every((l) => l.code.trim().length > 20));
ok('all code uses console.log', LESSONS.every((l) => l.code.includes('console.log')));
ok('getLesson finds', getLesson('debounce')?.id === 'debounce');
ok('getLesson missing -> undefined', getLesson('nope') === undefined);
ok('expected ids present', ['debounce', 'reducer', 'promisePool'].every((id) => !!getLesson(id)));

if (failures > 0) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log('\nAll patterns self-tests passed');
