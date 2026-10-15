import { expect, test } from '@playwright/test';

test('signed-in header does not fetch a remote profile image', async ({ page }) => {
  const remote: string[] = [];
  page.on('request', request => { if (request.url().includes('outside.invalid')) remote.push(request.url()); });
  await page.route('**/api/auth/me', route => route.fulfill({ json: { user: { id: 'audit', login: 'audit', name: 'Local User', avatar_url: 'https://outside.invalid/avatar.png' } } }));
  await page.route('**/api/user/**', route => route.fulfill({ status: 401, json: {} }));
  await page.goto('/es');
  await expect(page.getByRole('button', { name: 'Local User', exact: true })).toBeVisible();
  expect(remote).toEqual([]);
});

test('image file conversion stays in the browser', async ({ page }) => {
  const uploads: string[] = [];
  page.on('request', request => { if (request.method() === 'POST') uploads.push(request.url()); });
  await page.goto('/es/workbench/image-convert');
  const png = await page.evaluate(() => {
    const canvas = document.createElement('canvas'); canvas.width = 8; canvas.height = 8;
    return canvas.toDataURL('image/png').split(',')[1];
  });
  await page.locator('input[type=file]').setInputFiles({ name: 'private.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') });
  await expect(page.getByRole('img', { name: 'private.png', exact: true })).toBeVisible();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'JPG', exact: true }).click();
  expect((await download).suggestedFilename()).toBe('private.jpg');
  expect(uploads).toEqual([]);
});

test('Markdown never loads pasted remote images', async ({ page }) => {
  const remote: string[] = [];
  page.on('request', request => { if (request.url().includes('outside.invalid')) remote.push(request.url()); });
  await page.goto('/es/workbench/notes');
  await page.locator('main textarea').fill('![Remote image](https://outside.invalid/private)\n![Local image](/icons/icon-32.png)');
  const preview = page.getByTestId('notes-preview');
  await expect(preview.getByText('Remote image')).toBeVisible();
  await expect(preview.getByRole('img', { name: 'Local image' })).toBeVisible();
  await expect(preview.locator('img')).toHaveCount(1);
  expect(remote).toEqual([]);
});

test('drawing editor refuses pasted remote images', async ({ page }) => {
  const remote: string[] = [];
  page.on('request', request => { if (request.url().includes('outside.invalid')) remote.push(request.url()); });
  await page.goto('/es/workbench/excalidraw');
  await page.locator('.excalidraw canvas.interactive').click({ position: { x: 250, y: 200 } });
  await page.evaluate(() => {
    const data = new DataTransfer();
    data.setData('text/html', '<img src="https://outside.invalid/private.png">');
    data.setData('text/plain', 'https://outside.invalid/private.png');
    document.dispatchEvent(new ClipboardEvent('paste', { clipboardData: data, bubbles: true }));
  });
  await expect(page.getByText(/Esta vista no carga imágenes/)).toBeVisible();
  expect(remote).toEqual([]);
});

test('Mermaid refuses image-loading syntax before rendering and recovers', async ({ page }) => {
  const remote: string[] = [];
  page.on('request', request => { if (request.url().includes('outside.invalid')) remote.push(request.url()); });
  await page.goto('/es/workbench/mermaid');
  await page.locator('main textarea').fill('flowchart TD\n A@{ img: "https://outside.invalid/private", label: "Test" }');
  await expect(page.getByText(/Esta vista no carga imágenes/)).toBeVisible();
  expect(remote).toEqual([]);
  await page.locator('main textarea').fill('flowchart TD\n A-->B');
  await expect(page.getByRole('button', { name: /SVG/ })).toBeEnabled();
});

test('pattern sandbox runs local code with network disabled', async ({ page }) => {
  const outgoing: string[] = [];
  await page.route('**/outside.invalid/**', route => { outgoing.push(route.request().url()); return route.abort(); });
  await page.goto('/es/workbench/patterns');
  await page.locator('main textarea').fill("console.log('LOCAL_OK'); await fetch('https://outside.invalid/data').catch(() => console.log('NETWORK_BLOCKED'));");
  await page.getByRole('button', { name: /Ejecutar/ }).click();
  await expect(page.locator('main pre').last()).toContainText('LOCAL_OK');
  await expect(page.locator('main pre').last()).toContainText('NETWORK_BLOCKED');
  const policy = page.frameLocator('iframe[title="patterns-runner"]').locator('meta[http-equiv="Content-Security-Policy"]');
  await expect(policy).toHaveAttribute('content', /connect-src 'none'/);
  expect(outgoing).toEqual([]);
});

test('own-server telemetry is off until explicitly enabled', async ({ page }) => {
  const events: string[] = [];
  await page.route('**/api/usage/events', route => { events.push(route.request().url()); return route.fulfill({ status: 204 }); });
  await page.goto('/es/workbench/settings');
  const toggle = page.getByRole('switch', { name: 'Estadísticas de uso' });
  await expect(toggle).not.toBeChecked();
  await page.goto('/es/workbench/hash-digest');
  await page.locator('main textarea').fill('PRIVATE_INPUT_MUST_STAY_LOCAL');
  expect(events).toEqual([]);
  await page.goto('/es/workbench/settings');
  await toggle.check();
  await page.goto('/es/workbench/hash-digest');
  await expect.poll(() => events.length).toBeGreaterThan(0);
});

test('saved site monitors remain paused until enabled', async ({ page, baseURL }) => {
  await page.addInitScript(baseURL => {
    localStorage.setItem('hios:workbench:site-checker:v1', JSON.stringify([{ id: 'saved', url: `${baseURL}/api/version?monitor-test`, intervalSeconds: 15, timeoutMs: 1000, notifications: false, lastResult: null, history: [], checking: false }]));
  }, baseURL!);
  const checks: string[] = [];
  await page.route('**/api/version?monitor-test', route => { checks.push(route.request().url()); return route.fulfill({ status: 200, body: 'ok' }); });
  await page.goto('/es/workbench/site-checker');
  const periodic = page.getByRole('checkbox', { name: /Activar las comprobaciones/ });
  await expect(periodic).not.toBeChecked();
  await page.clock.install();
  await page.clock.runFor(16000);
  expect(checks).toEqual([]);
  await periodic.check();
  await page.clock.runFor(16000);
  await expect.poll(() => checks.length).toBeGreaterThan(0);
});

test('proxy URLs cannot initiate third-party queries without consent', async ({ request }) => {
  for (const endpoint of ['dns?domain=example.com', 'rdap?domain=example.com', 'certificate?hostname=example.com']) {
    const response = await request.get(`/api/workbench/${endpoint}`);
    expect(response.status()).toBe(403);
  }
});
