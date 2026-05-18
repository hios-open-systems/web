/**
 * Self-test for auth path sanitization. Guards the post-login open-redirect
 * fix (protocol-relative // and backslash tricks must not escape origin).
 *
 * Run: node --experimental-strip-types scripts/auth-selftest.ts
 */
import { safeNextPath } from '../lib/auth/github.ts';

let failures = 0;

function eq(name: string, got: string, want: string) {
  if (got !== want) {
    failures++;
    console.error(`✗ ${name}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
  } else {
    console.log(`✓ ${name}`);
  }
}

// Allowed: internal absolute paths pass through untouched.
eq('plain path', safeNextPath('/workbench'), '/workbench');
eq('path with query', safeNextPath('/workbench?tool=jwt-decode'), '/workbench?tool=jwt-decode');
eq('root', safeNextPath('/'), '/');

// Rejected -> '/': everything that could leave our origin.
eq('null', safeNextPath(null), '/');
eq('empty', safeNextPath(''), '/');
eq('protocol-relative', safeNextPath('//evil.com'), '/');
eq('backslash trick', safeNextPath('/\\evil.com'), '/');
eq('absolute url', safeNextPath('https://evil.com'), '/');
eq('no leading slash', safeNextPath('evil.com'), '/');
eq('triple slash', safeNextPath('///evil.com'), '/');

if (failures > 0) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log('\nAll auth self-tests passed');
