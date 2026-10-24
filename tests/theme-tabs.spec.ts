import { expect, test, type Page } from '@playwright/test';
import es from '../messages/es.json';

async function expectTheme(page: Page, mode: string, skin: string, accent: string) {
  await expect(page.locator('html')).toHaveAttribute('data-theme', mode);
  await expect(page.locator('html')).toHaveAttribute('data-skin', skin);
  await expect(page.getByTestId('accent-hex-input')).toHaveValue(accent);
  await expect(page.locator(`[data-skin-id="${skin}"]`)).toHaveAttribute('aria-checked', 'true');
  await expect.poll(() => page.evaluate(() => document.documentElement.style.getPropertyValue('--accent'))).toBe(accent);
}

test.beforeEach(async ({ context }) => {
  await context.route('**/api/auth/me', (route) => route.fulfill({ json: { user: null } }));
  await context.addInitScript(() => {
    const writes: string[] = [];
    Object.defineProperty(window, 'themeWrites', { value: writes });
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (['theme', 'hios-skin', 'hios-theme-config'].includes(key)) writes.push(key);
      original.call(this, key, value);
    };
  });
});

test('mode, skin and accent propagate both ways without echo writes or navigation', async ({ page, context }) => {
  const other = await context.newPage();
  await Promise.all([page.goto('/es/workbench/settings'), other.goto('/es/workbench/settings')]);
  await expectTheme(other, 'dark', 'datasheet', '#f59e0b');
  await page.locator('[data-preset-id="cyan"]').click();
  await page.locator('[data-skin-id="terminal"]').click();
  await page.getByRole('button', { name: es.Header.lightTheme, exact: true }).click();
  await expectTheme(other, 'light', 'terminal', '#0ea5e9');
  expect(await other.evaluate(() => Reflect.get(window, 'themeWrites'))).toEqual([]);
  await other.locator('[data-preset-id="violet"]').click();
  await other.locator('[data-skin-id="blueprint"]').click();
  await other.getByRole('button', { name: es.Header.darkTheme, exact: true }).click();
  await expectTheme(page, 'dark', 'blueprint', '#8b5cf6');
  expect(await page.evaluate(() => Reflect.get(window, 'themeWrites')))
    .toEqual(['hios-theme-config', 'hios-skin', 'theme']);
  await page.reload();
  await expectTheme(page, 'dark', 'blueprint', '#8b5cf6');
});

test('clearing preferences in another tab resets the appearance without recreating storage', async ({ page, context }) => {
  const other = await context.newPage();
  await page.goto('/es/workbench/settings');
  await page.locator('[data-preset-id="cyan"]').click();
  await page.locator('[data-skin-id="terminal"]').click();
  await page.getByRole('button', { name: es.Header.lightTheme, exact: true }).click();
  await other.goto('/es/workbench/settings');
  await expectTheme(other, 'light', 'terminal', '#0ea5e9');
  await page.evaluate(() => localStorage.clear());
  await expectTheme(other, 'dark', 'datasheet', '#f59e0b');
  expect(await other.evaluate(() => ['theme', 'hios-skin', 'hios-theme-config'].map((key) => localStorage.getItem(key))))
    .toEqual([null, null, null]);
  expect(await other.evaluate(() => Reflect.get(window, 'themeWrites'))).toEqual([]);
});

test('shared accent wins over a delayed account response without duplicate account writes', async ({ page, context }) => {
  const other = await context.newPage();
  let release = () => {};
  const pending = new Promise<void>((resolve) => { release = resolve; });
  let reading = false;
  const writes: string[] = [];
  await context.route('**/api/auth/me', (route) => route.fulfill({ json: {
    user: { id: 'tabs', login: 'tabs', name: null, avatar_url: null },
  } }));
  await context.route('**/api/user/settings', async (route) => {
    if (route.request().method() === 'PATCH') {
      const accent = route.request().postDataJSON().themeAccent as string;
      writes.push(accent);
      await route.fulfill({ json: { settings: { themeAccent: accent } } });
    } else {
      if (route.request().frame().page() === other) { reading = true; await pending; }
      await route.fulfill({ json: { settings: { themeAccent: '#8b5cf6' } } });
    }
  });
  await page.goto('/es/workbench/settings');
  await expect(page.getByTestId('accent-hex-input')).toHaveValue('#8b5cf6');
  await other.goto('/es/workbench/settings');
  await expect.poll(() => reading).toBe(true);
  await page.locator('[data-preset-id="cyan"]').click();
  await expectTheme(other, 'dark', 'datasheet', '#0ea5e9');
  const response = other.waitForResponse('**/api/user/settings');
  release();
  await (await response).finished();
  await expectTheme(other, 'dark', 'datasheet', '#0ea5e9');
  await expect(page.getByText(es.Settings.accountMode, { exact: true }).first()).toBeVisible();
  expect(writes).toEqual(['#0ea5e9']);
});

test('session storage is ignored and invalid shared values fall back safely', async ({ page, context }) => {
  const other = await context.newPage();
  await Promise.all([page.goto('/es/workbench/settings'), other.goto('/es/workbench/settings')]);
  await page.locator('[data-preset-id="cyan"]').click();
  await page.locator('[data-skin-id="terminal"]').click();
  await expectTheme(other, 'dark', 'terminal', '#0ea5e9');
  await other.evaluate(() => window.dispatchEvent(new StorageEvent('storage', { key: null, storageArea: sessionStorage })));
  await expectTheme(other, 'dark', 'terminal', '#0ea5e9');
  await page.evaluate(() => {
    localStorage.setItem('theme', 'invalid');
    localStorage.setItem('hios-skin', 'invalid');
    localStorage.setItem('hios-theme-config', '{broken');
  });
  await expectTheme(other, 'dark', 'datasheet', '#f59e0b');
  expect(await other.evaluate(() => Reflect.get(window, 'themeWrites'))).toEqual([]);
});

test('a tab still resolving login accepts the shared accent without uploading it again', async ({ page, context }) => {
  const other = await context.newPage();
  let release = () => {};
  const pending = new Promise<void>((resolve) => { release = resolve; });
  let settingsRequests = 0;
  await context.route('**/api/auth/me', async (route) => {
    if (route.request().frame().page() === other) {
      await pending;
      await route.fulfill({ json: { user: { id: 'tabs', login: 'tabs', name: null, avatar_url: null } } });
    } else await route.fulfill({ json: { user: null } });
  });
  await context.route('**/api/user/settings', async (route) => {
    settingsRequests++;
    await route.fulfill({ json: { settings: { themeAccent: '#8b5cf6' } } });
  });
  await Promise.all([page.goto('/es/workbench/settings'), other.goto('/es/workbench/settings')]);
  await page.locator('[data-preset-id="cyan"]').click();
  await expectTheme(other, 'dark', 'datasheet', '#0ea5e9');
  release();
  await expect(other.getByText(es.Settings.needsImport, { exact: true }).first()).toBeVisible();
  await expectTheme(other, 'dark', 'datasheet', '#0ea5e9');
  expect(settingsRequests).toBe(0);
});

test('a slowly loading tab catches changes made before its storage listener exists', async ({ page, context }) => {
  await page.goto('/es/workbench/settings');
  const other = await context.newPage();
  let resume = () => {};
  const pending = new Promise<void>((resolve) => { resume = resolve; });
  await other.route('**/_next/static/**/*.js', async (route) => { await pending; await route.continue(); });
  try {
    await other.goto('/es/workbench/settings', { waitUntil: 'commit' });
    await expect(other.getByRole('heading', { name: 'Configuración', level: 1 })).toBeVisible();
    await page.locator('[data-preset-id="cyan"]').click();
    await page.locator('[data-skin-id="terminal"]').click();
    await page.getByRole('button', { name: es.Header.lightTheme, exact: true }).click();
  } finally { resume(); }
  await expectTheme(other, 'light', 'terminal', '#0ea5e9');
  expect(await other.evaluate(() => Reflect.get(window, 'themeWrites'))).toEqual([]);
});
