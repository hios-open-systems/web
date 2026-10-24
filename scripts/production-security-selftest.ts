import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import ts from 'typescript';
import { enforceNativeLimit } from '../lib/nativeRateLimit.ts';
import { verifyTurnstile } from '../lib/turnstile.ts';

const request = new Request('https://openhios.dev/api/feedback', { headers: {
  'cf-connecting-ip': '192.0.2.1', 'x-forwarded-for': 'spoofed',
} });
let key = '';
assert.equal(await enforceNativeLimit({ limit: async options => { key = options.key; return { success: true }; } }, request, 'feedback'), null);
assert.equal(key, 'feedback:192.0.2.1');
const denied = await enforceNativeLimit({ limit: async () => ({ success: false }) }, request, 'feedback');
assert.equal(denied?.status, 429);
assert.equal(denied?.headers.get('Retry-After'), '60');
assert.equal((await enforceNativeLimit(undefined, request, 'feedback'))?.status, 503);
assert.equal((await enforceNativeLimit({ limit: async () => { throw new Error('offline'); } }, request, 'feedback'))?.status, 503);

const originalFetch = globalThis.fetch;
const originalEnv = { ...process.env };
try {
  process.env.NODE_ENV = 'production';
  delete process.env.TURNSTILE_SECRET_KEY;
  assert.equal(await verifyTurnstile('token', null, 'feedback'), false);
  process.env.TURNSTILE_SECRET_KEY = 'synthetic-test-secret';
  process.env.AUTH_BASE_URL = 'https://openhios.dev';
  let calls = 0;
  let result: unknown = { success: true, hostname: 'openhios.dev', action: 'feedback' };
  globalThis.fetch = async (_url, options) => {
    calls++;
    assert.equal(options?.redirect, 'error');
    assert.ok(options?.signal);
    return Response.json(result);
  };
  for (const token of [undefined, {}, [], '', 'a'.repeat(2049)]) {
    assert.equal(await verifyTurnstile(token, null, 'feedback'), false);
  }
  assert.equal(calls, 0);
  assert.equal(await verifyTurnstile('valid', null, 'feedback'), true);
  assert.equal(await verifyTurnstile('valid', null, 'guestbook'), false);
  for (const invalid of [null, {}, { success: true }, { success: true, hostname: 'evil.test', action: 'feedback' }, { success: false, hostname: 'openhios.dev', action: 'feedback' }]) {
    result = invalid;
    assert.equal(await verifyTurnstile('valid', null, 'feedback'), false);
  }
  result = { success: true, hostname: 'openhios.dev', action: 'guestbook' };
  assert.equal(await verifyTurnstile('valid', null, 'guestbook'), true);
  globalThis.fetch = async () => { throw new Error('timeout'); };
  assert.equal(await verifyTurnstile('valid', null, 'feedback'), false);
  globalThis.fetch = async () => new Response('unavailable', { status: 503 });
  assert.equal(await verifyTurnstile('valid', null, 'feedback'), false);
} finally {
  globalThis.fetch = originalFetch;
  process.env = originalEnv;
}
console.log('Native rate limiting and Turnstile production failure modes: OK');

const config = ts.parseConfigFileTextToJson('wrangler.jsonc', readFileSync('wrangler.jsonc', 'utf8')).config;
assert.equal(config.account_id, '74517853847d3bfb25721012cf268858');
assert.equal(config.workers_dev, false);
assert.equal(config.preview_urls, false);
assert.equal(config.observability.redact_query_string, true);
assert.equal(config.vars.ADMIN_GITHUB_ID, '37183343');
for (const limit of [3, 5, 10, 20, 30, 60, 120]) {
  const binding = config.ratelimits.find((item: { name: string }) => item.name === `RATE_LIMIT_${limit}`);
  assert.deepEqual(binding.simple, { limit, period: 60 });
}
const release = spawnSync(process.execPath, ['scripts/security-release-check.mjs'], {
  env: { ...process.env, NEXT_PUBLIC_TURNSTILE_SITEKEY: '' }, encoding: 'utf8',
});
assert.notEqual(release.status, 0);
assert.match(release.stderr, /Configure a real NEXT_PUBLIC_TURNSTILE_SITEKEY/);
console.log('Production configuration and missing-key release gate: OK');
