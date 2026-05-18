/**
 * Self-test for the Regex tester logic (pure, sync).
 *
 * Run: node --experimental-strip-types scripts/regex-selftest.ts
 */
import { MAX_MATCHES, replacePreview, runRegex, sanitizeFlags } from '../lib/workbench/regex.ts';

let failures = 0;
function ok(name: string, cond: boolean) {
  if (!cond) {
    failures++;
    console.error(`✗ ${name}`);
  } else {
    console.log(`✓ ${name}`);
  }
}

const r1 = runRegex('\\d+', 'g', 'a1b22c333');
ok('matches all', r1.ok && r1.matches.map((m) => m.match).join(',') === '1,22,333');
ok('match index', r1.ok && r1.matches[1].index === 3);

const r2 = runRegex('(\\w)(\\d)', 'g', 'a1 b2');
ok('numbered groups', r2.ok && r2.matches[0].groups.join('') === 'a1');

const r3 = runRegex('(?<letter>\\w)(?<num>\\d)', '', 'x9');
ok('named groups', r3.ok && r3.matches[0].named.letter === 'x' && r3.matches[0].named.num === '9');

const bad = runRegex('(', 'g', 'whatever');
ok('invalid pattern -> error', !bad.ok);

const empty = runRegex('a*', 'g', 'bbb');
ok('zero-length safe (no infinite loop)', empty.ok && !empty.truncated);

const many = runRegex('a', 'g', 'a'.repeat(MAX_MATCHES + 50));
ok('match cap truncates', many.ok && many.truncated && many.matches.length === MAX_MATCHES);

const rep = replacePreview('\\d+', 'g', 'a1b2', '#');
ok('replace preview', rep.ok && rep.value === 'a#b#');

const repNamed = replacePreview('(?<n>\\d)', 'g', 'x5', '[$<n>]');
ok('replace named group', repNamed.ok && repNamed.value === 'x[5]');

ok('sanitizeFlags dedups+filters', sanitizeFlags('ggimz!') === 'gim');

if (failures > 0) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log('\nAll regex self-tests passed');
