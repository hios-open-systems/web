import { test, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import es from '../messages/es.json';

const origin = 'http://localhost:3202';
const owner = { Cookie: 'hios_session=security-owner-session' };
const headers = { Origin: origin, 'User-Agent': 'Mozilla/5.0 Chrome/130.0' };
const event = () => ({ version: 2, eventId: crypto.randomUUID(), eventName: 'tool_open', path: '/workbench/hash-digest', locale: 'es', toolId: 'hash-digest' });

test('analytics counts repeated event IDs once without unique users or request dimensions', async ({ request }) => {
  const before = await (await request.get('/api/usage/summary?days=7', { headers: owner })).json();
  const payload = event();
  // Same nonce arriving concurrently still increments once in D1's transaction.
  const replies = await Promise.all([1, 2, 3].map(() => request.post('/api/usage/events', {
    headers: { ...headers, Cookie: owner.Cookie, 'CF-Ray': 'private-ray', 'CF-IPCountry': 'AR', Referer: origin + '/secret' }, data: payload,
  })));
  expect(replies.map(reply => reply.status())).toEqual([204, 204, 204]);
  const after = await (await request.get('/api/usage/summary?days=7', { headers: owner })).json();
  expect(after.totals.toolOpens).toBe(before.totals.toolOpens + 1);
  expect(after.totals.events).toBe(before.totals.events + 1);
  expect(after.totals.uniqueUsers).toBeUndefined();
  expect(JSON.stringify(after)).not.toMatch(/private-ray|security-owner|secret|user_id|country|referer/);
  expect(after.timeline).toHaveLength(7 * 7);
});

test('privacy signals, bots, arbitrary paths and extra fields never increment analytics', async ({ request }) => {
  const before = await (await request.get('/api/usage/summary', { headers: owner })).json();
  const exclusions: Record<string, string>[] = [{ DNT: '1' }, { 'Sec-GPC': '1' }, { 'User-Agent': 'Googlebot' }];
  for (const extra of exclusions) {
    expect((await request.post('/api/usage/events', { headers: { ...headers, ...extra }, data: event() })).status()).toBe(204);
  }
  for (const changes of [{ path: '/workbench/spaces/private' }, { metadata: { content: 'private' } },
    { toolId: 'invalid' }, { locale: 'zz' }, { path: '/workbench/notes' }, { eventName: 'purchase' }, { version: 1 }]) {
    expect((await request.post('/api/usage/events', { headers, data: { ...event(), ...changes } })).status()).toBe(400);
  }
  expect((await request.post('/api/usage/events', { headers, data: { ...event(), extra: 'x'.repeat(3000) } })).status()).toBe(413);
  const after = await (await request.get('/api/usage/summary', { headers: owner })).json();
  expect(after.totals).toEqual(before.totals);
});

test('public aggregate caches across cookies and query strings; private APIs never share cache', async ({ request }) => {
  const baseline = await (await request.get('/api/usage/summary?days=30', { headers: owner })).json();
  const response = await request.get('/api/stats/public?ignored=first');
  expect(response.status()).toBe(200);
  expect(response.headers()['cache-control']).toBe('public, max-age=0, s-maxage=3600, no-transform');
  expect(response.headers()['set-cookie']).toBeUndefined();
  const initial = await response.json();
  expect(initial.perDay).toHaveLength(30);
  for (const key of ['pages', 'referrers', 'countries', 'locales']) {
    expect(initial[key].every((row: { count: number }) => row.count >= 2), key).toBe(true);
  }
  expect((await request.post('/api/usage/events', { headers, data: event() })).status()).toBe(204);
  const next = await request.get('/api/stats/public?ignored=second', { headers: owner });
  if (process.env.SECURITY_WORKER === '1') expect(await next.json()).toEqual(initial);
  for (const path of ['/api/auth/me', '/api/usage/summary', '/api/user/workspaces', '/api/stats/public/unknown']) {
    const result = await request.get(path, { headers: owner });
    expect(result.headers()['cache-control'], path).toContain('no-store');
    expect(result.headers()['cache-control'], path).not.toContain('s-maxage');
  }
  const privateResult = await request.get('/api/usage/summary?days=30', { headers: owner });
  expect((await privateResult.json()).totals.toolOpens).toBe(baseline.totals.toolOpens + 1);
  expect((await request.get('/api/usage/summary')).status()).toBe(401);
});

function sql(command: string): unknown {
  const output = execFileSync(process.execPath, ['node_modules/wrangler/bin/wrangler.js', 'd1', 'execute', 'DB',
    '--local', '--yes', '--config', 'tests/fixtures/workspaces.wrangler.jsonc', '--persist-to', '.wrangler/workspace-e2e', '--command', command, '--json'], { encoding: 'utf8' });
  return JSON.parse(output);
}

test('scheduled cleanup removes expired analytics even without new events', async ({ request }) => {
  test.skip(process.env.SECURITY_WORKER !== '1', 'Scheduled handlers run in the Worker runtime');
  sql("INSERT OR REPLACE INTO usage_daily VALUES ('2000-01-01','page_view','/','','',2,1);");
  const response = await request.get('/__scheduled?cron=0+0+*+*+*');
  expect(response.ok()).toBe(true);
  expect(JSON.stringify(sql("SELECT count(*) AS expired FROM usage_daily WHERE day='2000-01-01'"))).toContain('"expired":0');
});

test('browser consent flows through the Worker and D1 into the owner dashboard', async ({ browser, request }) => {
  test.skip(process.env.SECURITY_WORKER !== '1', 'Uses the built production client');
  const before = await (await request.get('/api/usage/summary?days=30', { headers: owner })).json();
  const context = await browser.newContext({ baseURL: origin, userAgent: headers['User-Agent'] });
  try {
    const page = await context.newPage();
    await page.goto('/es/workbench/settings');
    await page.getByRole('switch', { name: 'Estadísticas de uso' }).check();
    const recorded = page.waitForResponse(response => response.url().endsWith('/api/usage/events')
      && response.request().postDataJSON()?.eventName === 'tool_open');
    await page.goto('/es/workbench/hash-digest');
    expect((await recorded).status()).toBe(204);
    const after = await (await request.get('/api/usage/summary?days=30', { headers: owner })).json();
    expect(after.totals.toolOpens).toBe(before.totals.toolOpens + 1);
    await context.addCookies([{ name: 'hios_session', value: 'security-owner-session', url: origin }]);
    // Admin needs a passkey on top of the owner session: enroll one with a virtual authenticator.
    const cdp = await context.newCDPSession(page);
    await cdp.send('WebAuthn.enable');
    await cdp.send('WebAuthn.addVirtualAuthenticator', { options: { protocol: 'ctap2', transport: 'internal',
      hasResidentKey: true, hasUserVerification: true, isUserVerified: true, automaticPresenceSimulation: true } });
    expect((await request.get('/api/admin/traffic', { headers: owner })).status()).toBe(403);
    await page.goto('/es/admin');
    await page.getByRole('button', { name: 'Registrar passkey' }).click();
    await page.getByText('Eventos voluntarios (opt-in, muestra parcial)').click();
    const stat = page.locator('.ant-statistic').filter({ hasText: es.Workbench.usageAnalytics.totalsToolOpens });
    await expect(stat.locator('.ant-statistic-content-value')).toHaveText(String(after.totals.toolOpens));
  } finally { await context.close(); }
});
