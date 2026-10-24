import { expect, test, type Page } from '@playwright/test';
import es from '../messages/es.json';

function deferred() {
  let resolve = () => {};
  const promise = new Promise<void>((done) => { resolve = done; });
  return { promise, resolve };
}

async function mockUser(page: Page, pending = Promise.resolve()) {
  await page.route('**/api/auth/me', async (route) => {
    await pending;
    await route.fulfill({ json: { user: { id: 'theme-user', login: 'theme-user', name: null, avatar_url: null } } });
  });
}

async function expectAccent(page: Page, accent: string) {
  await expect(page.getByTestId('accent-hex-input')).toHaveValue(accent);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('hios-theme-config') ?? 'null').accent)).toBe(accent);
  expect(await page.evaluate(() => document.documentElement.style.getPropertyValue('--accent'))).toBe(accent);
}

for (const status of [200, 503]) {
  test(`late initial settings (${status}) cannot replace a newer choice or sync status`, async ({ page }) => {
    const started = deferred();
    const release = deferred();
    await mockUser(page);
    await page.route('**/api/user/settings', async (route) => {
      if (route.request().method() === 'GET') {
        started.resolve();
        await release.promise;
        await route.fulfill({ status, json: { settings: { themeAccent: '#8b5cf6' } } });
      } else {
        await route.fulfill({ json: { settings: { themeAccent: route.request().postDataJSON().themeAccent } } });
      }
    });
    await page.goto('/es/workbench/settings');
    await started.promise;
    await page.locator('[data-preset-id="cyan"]').click();
    await expect(page.getByText(es.Settings.accountMode, { exact: true }).first()).toBeVisible();
    const response = page.waitForResponse((res) => res.url().endsWith('/api/user/settings') && res.request().method() === 'GET');
    release.resolve();
    await (await response).finished();
    await expectAccent(page, '#0ea5e9');
    await expect(page.getByText(es.Settings.accountMode, { exact: true }).first()).toBeVisible();
  });
}

for (const status of [200, 503]) {
  test(`queued saves preserve the latest choice after an older write returns ${status}`, async ({ page }) => {
    const firstWrite = deferred();
    const release = deferred();
    let remoteAccent = '#f59e0b';
    const writes: string[] = [];
    await mockUser(page);
    await page.route('**/api/user/settings', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ json: { settings: { themeAccent: remoteAccent } } });
        return;
      }
      const accent = route.request().postDataJSON().themeAccent as string;
      writes.push(accent);
      if (accent === '#0ea5e9') {
        firstWrite.resolve();
        await release.promise;
      }
      const responseStatus = accent === '#0ea5e9' ? status : 200;
      if (responseStatus === 200) remoteAccent = accent;
      await route.fulfill({ status: responseStatus, json: { settings: { themeAccent: accent } } });
    });
    await page.goto('/es/workbench/settings');
    await expect(page.getByText(es.Settings.accountMode, { exact: true }).first()).toBeVisible();
    await page.locator('[data-preset-id="cyan"]').click();
    await firstWrite.promise;
    await page.locator('[data-preset-id="lime"]').click();
    await expectAccent(page, '#84cc16');
    release.resolve();
    await expect(page.getByText(es.Settings.accountMode, { exact: true }).first()).toBeVisible();
    await expect.poll(() => remoteAccent).toBe('#84cc16');
    expect(writes).toEqual(['#0ea5e9', '#84cc16']);
    await expectAccent(page, '#84cc16');
    await page.reload();
    await expect(page.getByText(es.Settings.accountMode, { exact: true }).first()).toBeVisible();
    await expectAccent(page, '#84cc16');
  });
}

test('a choice made while authentication loads is saved instead of overwritten', async ({ page }) => {
  const auth = deferred();
  let saved: string | null = null;
  await mockUser(page, auth.promise);
  await page.route('**/api/user/settings', async (route) => {
    if (route.request().method() === 'PATCH') saved = route.request().postDataJSON().themeAccent as string;
    await route.fulfill({ json: { settings: { themeAccent: saved ?? '#8b5cf6' } } });
  });
  await page.goto('/es/workbench/settings');
  await page.locator('[data-preset-id="cyan"]').click();
  auth.resolve();
  await expect.poll(() => saved).toBe('#0ea5e9');
  await expectAccent(page, '#0ea5e9');
  await expect(page.getByText(es.Settings.accountMode, { exact: true }).first()).toBeVisible();
});
