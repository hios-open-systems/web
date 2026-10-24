import { checkRateLimit } from '../lib/rateLimit.ts';
/**
 * Self-test for auth path sanitization. Guards the post-login open-redirect
 * fix (protocol-relative // and backslash tricks must not escape origin).
 *
 * Run: node --experimental-strip-types scripts/auth-selftest.ts
 */
import assert from 'node:assert/strict';
import { readJsonBody, requireSameOrigin } from '../lib/httpSecurity.ts';
import { isOwner } from '../lib/auth/owner.ts';
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

assert.equal(safeNextPath('/\t/evil.example'), '/');
assert.equal(safeNextPath('/\n\\evil.example'), '/');
assert.equal(isOwner({ github_id: 37183343 }), true);
assert.equal(isOwner({ github_id: 990101 }), false);
const savedId = process.env.ADMIN_GITHUB_ID;
process.env.ADMIN_GITHUB_ID = '990101';
assert.equal(isOwner({ github_id: 990101 }), true);
process.env.ADMIN_GITHUB_ID = 'invalid';
assert.equal(isOwner({ github_id: 37183343 }), false);
if (savedId === undefined) delete process.env.ADMIN_GITHUB_ID;
else process.env.ADMIN_GITHUB_ID = savedId;
const origin = 'https://openhios.dev';
assert.equal(requireSameOrigin(new Request(origin, { headers: { Origin: origin } })), null);
assert.equal(requireSameOrigin(new Request(origin, { headers: { Origin: origin, 'Sec-Fetch-Site': 'cross-site' } }))?.status, 403);
let cancelled = false;
const body = new ReadableStream<Uint8Array>({
  start(controller) { controller.enqueue(new TextEncoder().encode('"áááá"')); },
  cancel() { cancelled = true; },
});
// No Content-Length: the byte limit must cancel the stream without waiting for EOF.
await assert.rejects(readJsonBody(new Request(origin, { method: 'POST', body, duplex: 'half' } as RequestInit), 6),
  error => error instanceof Response && error.status === 413);
assert.equal(cancelled, true);
assert.deepEqual(await readJsonBody(new Request(origin, { method: 'POST', body: '{"ok":true}' })), { ok: true });
console.log('HTTP security checks passed');

const limitedRequest = new Request(origin, { headers: { 'cf-connecting-ip': 'original' } });
const rateOptions = { limit: 1, windowMs: 60_000 };
assert.equal(checkRateLimit(limitedRequest, 'test-capacity', rateOptions), null);
for (let i = 0; i < 5001; i++) {
  checkRateLimit(new Request(origin, { headers: { 'cf-connecting-ip': String(i) } }), 'test-capacity', rateOptions);
}
assert.equal(checkRateLimit(limitedRequest, 'test-capacity', rateOptions)?.status, 429);
console.log('Rate limits survive bucket saturation');
