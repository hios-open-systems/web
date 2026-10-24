import { test, expect } from '@playwright/test';
import { publicUsage } from '../lib/analytics/summary';

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

test('public stats show zero days, methodology and outcome counts', async ({ page }, testInfo) => {
  const date = new Date('2026-10-24T12:00:00Z');
  const data = publicUsage([{ day: '2026-10-24', event_name: 'export_generated', path: '/workbench/image-convert', locale: 'es', tool_id: 'image-convert', version: 2, count: 8 }], 0, date);
  await page.route('**/api/stats/public', route => route.fulfill({ json: data }));
  await page.goto('/es/stats');
  await expect(page.getByText('Exportaciones preparadas', { exact: true })).toBeVisible();
  await expect(page.locator('[title="2026-10-23: 0"]')).toHaveCSS('height', '0px');
  await expect(page.getByText(/Contamos eventos, no personas/)).toBeVisible();
  await expect(page.getByText(/usuarios únicos/i)).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath('usage-stats.png'), fullPage: true });
});

test('public stats failures remain uncached in the standalone server', async ({ request }) => {
  const response = await request.get('/api/stats/public');
  expect(response.status()).toBe(503);
  expect(response.headers()['cache-control']).toContain('no-store');
  expect(response.headers()['cache-control']).not.toContain('s-maxage');
});
