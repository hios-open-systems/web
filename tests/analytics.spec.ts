import { test, expect } from '@playwright/test';
import { publicTraffic } from '../lib/traffic/public';
import { trafficRange } from '../lib/traffic/read';
import es from '../messages/es.json';

test('expanded telemetry needs fresh consent and sends no cookie, referrer or input content', async ({ page, context, baseURL }) => {
  const events: { body: Record<string, unknown>; headers: Record<string, string> }[] = [];
  await context.addCookies([{ name: 'hios_session', value: 'private-session', url: baseURL! }]);
  await page.addInitScript(() => localStorage.setItem('hios-telemetry', 'on'));
  await page.route('**/api/usage/events', async route => {
    events.push({ body: route.request().postDataJSON(), headers: await route.request().allHeaders() });
    await route.fulfill({ status: 204 });
  });
  await page.goto('/es/workbench/settings');
  const toggle = page.getByRole('switch', { name: 'Estadísticas de uso' });
  await expect(toggle).not.toBeChecked();
  await page.goto('/es/workbench/hash-digest');
  await page.locator('main textarea').fill('PRIVATE_INPUT');
  expect(events).toEqual([]);
  await page.goto('/es/workbench/settings');
  await toggle.check();
  await page.goto('/es/workbench/hash-digest?private=SECRET');
  await page.locator('main textarea').fill('PRIVATE_INPUT');
  await expect.poll(() => events.length).toBe(2);
  expect(events.map(event => event.body.eventName).sort()).toEqual(['page_view', 'tool_open']);
  for (const event of events) {
    expect(event.headers.cookie).toBeUndefined();
    expect(event.headers.referer).toBeUndefined();
    expect(Object.keys(event.body).sort()).toEqual(['eventId', 'eventName', 'locale', 'path', 'toolId', 'version']);
    expect(event.body.path).toBe('/workbench/hash-digest');
  }
  expect(JSON.stringify(events)).not.toMatch(/PRIVATE_INPUT|SECRET|private-session/);
  await page.goto('/es/workbench/settings');
  await toggle.uncheck();
  await page.goto('/es/workbench/hash-digest');
  await expect(page.locator('main textarea')).toBeVisible();
  expect(events).toHaveLength(2);
});

for (const signal of ['dnt', 'gpc'] as const) {
  test(`${signal} prevents navigation and action telemetry after opt-in`, async ({ page }) => {
    await page.addInitScript(signal => {
      localStorage.setItem('hios-telemetry-v2', 'on');
      Object.defineProperty(navigator, signal === 'dnt' ? 'doNotTrack' : 'globalPrivacyControl', { configurable: true, value: signal === 'dnt' ? '1' : true });
    }, signal);
    const events: string[] = [];
    await page.route('**/api/usage/events', route => { events.push(route.request().url()); return route.fulfill({ status: 204 }); });
    await page.goto('/es/workbench/hash-digest');
    await page.locator('main textarea').fill('PRIVATE');
    expect(events).toEqual([]);
  });
}

test('a prepared image export counts an outcome without uploading the file or its name', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('hios-telemetry-v2', 'on'));
  const events: Record<string, unknown>[] = [];
  await page.route('**/api/usage/events', route => { events.push(route.request().postDataJSON()); return route.fulfill({ status: 204 }); });
  await page.goto('/es/workbench/image-convert');
  const png = await page.evaluate(() => {
    const canvas = document.createElement('canvas'); canvas.width = 8; canvas.height = 8;
    return canvas.toDataURL('image/png').split(',')[1];
  });
  await page.locator('input[type=file]').setInputFiles({ name: 'SECRET_CLIENT.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') });
  await expect(page.getByRole('img', { name: 'SECRET_CLIENT.png', exact: true })).toBeVisible();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'JPG', exact: true }).click();
  expect((await download).suggestedFilename()).toBe('SECRET_CLIENT.jpg');
  await expect.poll(() => events.filter(event => event.eventName === 'export_generated').length).toBe(1);
  const outcome = events.find(event => event.eventName === 'export_generated')!;
  expect(outcome.toolId).toBe('image-convert');
  expect(JSON.stringify(events)).not.toContain('SECRET_CLIENT');
});

test('public stats show traction: visitors, pages, referrers and countries', async ({ page }, testInfo) => {
  const now = new Date('2026-10-24T12:00:00Z');
  const range = trafficRange(30, now);
  const perDay = Array.from({ length: 30 }, (_, i) => ({ day: new Date(Date.parse(`${range.from}T00:00:00Z`) + i * 86_400_000).toISOString().slice(0, 10), views: 0, visitors: 0 }));
  perDay[29] = { day: '2026-10-24', views: 12, visitors: 5 };
  const data = publicTraffic({ range, generatedAt: now.toISOString(), totals: { views: 12, visitors: 5 }, perDay,
    pages: [{ name: '/projects/pad', count: 8 }, { name: '/secret-single', count: 1 }],
    referrers: [{ name: 'news.ycombinator.com', count: 4 }], countries: [{ name: 'AR', count: 9 }], locales: [{ name: 'es', count: 12 }] }, 0);
  await page.route('**/api/stats/public', route => route.fulfill({ json: data }));
  await page.goto('/es/stats');
  await expect(page.getByText('Visitantes', { exact: true })).toBeVisible();
  await expect(page.getByText('/projects/pad', { exact: true })).toBeVisible();
  await expect(page.getByText('/secret-single')).toHaveCount(0);
  await expect(page.getByText('news.ycombinator.com', { exact: true })).toBeVisible();
  await expect(page.getByText('Argentina', { exact: true })).toBeVisible();
  await expect(page.locator('[title="2026-10-23: 0 · 0"]')).toHaveCSS('height', '0px');
  await page.screenshot({ path: testInfo.outputPath('usage-stats.png'), fullPage: true });
});

test('public stats failures remain uncached in the standalone server', async ({ request }) => {
  const response = await request.get('/api/stats/public');
  expect(response.status()).toBe(503);
  expect(response.headers()['cache-control']).toContain('no-store');
  expect(response.headers()['cache-control']).not.toContain('s-maxage');
});

test('stats page makes no third-party requests and survives an API failure', async ({ page }) => {
  const external: string[] = [];
  page.on('request', request => {
    if (/^https?:/.test(request.url()) && new URL(request.url()).hostname !== '127.0.0.1') external.push(request.url());
  });
  await page.route('**/api/stats/public', route => route.fulfill({ status: 503, json: { error: 'unavailable' } }));
  await page.goto('/es/stats');
  await expect(page.getByText(es.PublicStats.error, { exact: true })).toBeVisible();
  await expect(page.getByText(es.PublicStats.methodology, { exact: true })).toBeVisible();
  expect(external).toEqual([]);
  await page.setViewportSize({ width: 360, height: 800 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
});
