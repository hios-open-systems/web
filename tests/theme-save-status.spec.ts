import { expect, test, type Page } from '@playwright/test';
import es from '../messages/es.json';
import en from '../messages/en.json';
import de from '../messages/de.json';
import it from '../messages/it.json';

async function mockUser(page: Page, signedIn = true) {
  await page.route('**/api/auth/me', (route) => route.fulfill({ json: {
    user: signedIn ? { id: 'save-status', login: 'save-status', name: null, avatar_url: null } : null,
  } }));
}

test('anonymous changes confirm browser storage and survive a reload', async ({ page }) => {
  await mockUser(page, false);
  await page.goto('/es/workbench/settings');
  await expect(page.getByTestId('theme-local-status')).toHaveText(es.Settings.defaultColor);
  await expect(page.getByTestId('theme-account-status')).toHaveText(es.Settings.signedOut);
  await page.locator('[data-preset-id="cyan"]').click();
  await expect(page.getByTestId('theme-local-status')).toHaveText(es.Settings.localMode);
  await page.reload();
  await expect(page.getByTestId('theme-local-status')).toHaveText(es.Settings.localMode);
  await expect(page.getByTestId('accent-hex-input')).toHaveValue('#0ea5e9');
  await expect(page.getByText(es.Settings.accountMode, { exact: true })).toHaveCount(0);
});

test('empty account and pending saves are never presented as synchronized', async ({ page }) => {
  await mockUser(page);
  let release = () => {};
  const pending = new Promise<void>((resolve) => { release = resolve; });
  await page.route('**/api/user/settings', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ json: { settings: { themeAccent: null } } });
    } else {
      await pending;
      await route.fulfill({ json: { settings: { themeAccent: '#0ea5e9' } } });
    }
  });
  await page.goto('/es/workbench/settings');
  await expect(page.getByTestId('theme-account-status')).toHaveText(es.Settings.needsImport);
  await expect(page.getByTestId('theme-local-status')).toHaveText(es.Settings.defaultColor);
  await page.locator('[data-preset-id="cyan"]').click();
  await expect(page.getByTestId('theme-local-status')).toHaveText(es.Settings.localMode);
  await expect(page.getByTestId('theme-account-status')).toHaveText(es.Settings.syncing);
  await expect(page.getByText(es.Settings.accountMode, { exact: true })).toHaveCount(0);
  release();
  await expect(page.getByTestId('theme-account-status')).toHaveText(es.Settings.accountMode);
});

for (const response of ['failure', 'wrong-color', 'missing-color']) {
  test(`unconfirmed save (${response}) keeps the local color and offers a working retry`, async ({ page }, testInfo) => {
    await mockUser(page);
    let attempts = 0;
    await page.route('**/api/user/settings', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ json: { settings: { themeAccent: null } } });
        return;
      }
      attempts++;
      const accent = attempts > 1 ? '#0ea5e9' : response === 'wrong-color' ? '#8b5cf6' : null;
      await route.fulfill({ status: attempts === 1 && response === 'failure' ? 503 : 200,
        json: { settings: { themeAccent: accent } } });
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/es/workbench/settings');
    await expect(page.getByTestId('theme-account-status')).toHaveText(es.Settings.needsImport);
    await page.locator('[data-preset-id="cyan"]').click();
    await expect(page.getByTestId('theme-local-status')).toHaveText(es.Settings.localMode);
    await expect(page.getByTestId('theme-account-status')).toHaveText(es.Settings.syncUnavailable);
    await expect(page.getByTestId('accent-hex-input')).toHaveValue('#0ea5e9');
    if (response === 'failure') await page.locator('[aria-labelledby="theme-save-title"]').screenshot({ path: testInfo.outputPath('save-failed.png') });
    await page.getByRole('button', { name: es.Settings.retrySync, exact: true }).click();
    await expect(page.getByTestId('theme-account-status')).toHaveText(es.Settings.accountMode);
    expect(attempts).toBe(2);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test('a failed local write is reported independently from a successful account save', async ({ page }) => {
  await mockUser(page);
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => { throw new DOMException('Storage full', 'QuotaExceededError'); };
  });
  await page.route('**/api/user/settings', (route) => route.fulfill({ json: { settings: {
    themeAccent: route.request().method() === 'GET' ? null : route.request().postDataJSON().themeAccent,
  } } }));
  await page.goto('/es/workbench/settings');
  await expect(page.getByTestId('theme-account-status')).toHaveText(es.Settings.needsImport);
  await page.locator('[data-preset-id="cyan"]').click();
  await expect(page.getByTestId('theme-local-status')).toHaveText(es.Settings.localSaveUnavailable);
  await expect(page.getByTestId('theme-account-status')).toHaveText(es.Settings.accountMode);
  await expect(page.getByText(es.Settings.localMode, { exact: true })).toHaveCount(0);
  await expect(page.getByTestId('accent-hex-input')).toHaveValue('#0ea5e9');
});

test('account reads remain checking until confirmed, and failures expose retry', async ({ page }) => {
  await mockUser(page);
  let release = () => {};
  const pending = new Promise<void>((resolve) => { release = resolve; });
  await page.route('**/api/user/settings', async (route) => {
    await pending;
    await route.fulfill({ status: 503, json: { error: 'Unavailable' } });
  });
  await page.goto('/es/workbench/settings');
  await expect(page.getByTestId('theme-account-status')).toHaveText(es.Settings.checkingAccount);
  await expect(page.getByText(es.Settings.accountMode, { exact: true })).toHaveCount(0);
  release();
  await expect(page.getByTestId('theme-account-status')).toHaveText(es.Settings.syncUnavailable);
  await expect(page.getByRole('button', { name: es.Settings.retrySync, exact: true })).toBeVisible();
});

test('blocked storage never claims that the color is saved locally', async ({ page }) => {
  await mockUser(page, false);
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() { throw new DOMException('Blocked', 'SecurityError'); },
    });
  });
  await page.goto('/es/workbench/settings');
  await expect(page.getByTestId('theme-local-status')).toHaveText(es.Settings.localSaveUnavailable);
  await page.locator('[data-preset-id="cyan"]').click();
  await expect(page.getByTestId('theme-local-status')).toHaveText(es.Settings.localSaveUnavailable);
  await expect(page.getByTestId('theme-account-status')).toHaveText(es.Settings.signedOut);
  await expect(page.getByText(es.Settings.localMode, { exact: true })).toHaveCount(0);
});

for (const [locale, messages] of Object.entries({ en, es, de, it })) {
  test(`save destinations are translated and fit mobile: ${locale}`, async ({ page }, testInfo) => {
    await mockUser(page);
    await page.route('**/api/user/settings', (route) => route.fulfill({ json: { settings: { themeAccent: '#0ea5e9' } } }));
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/${locale}/workbench/settings`);
    await expect(page.getByTestId('theme-local-status')).toHaveText(messages.Settings.localMode);
    await expect(page.getByTestId('theme-account-status')).toHaveText(messages.Settings.accountMode);
    await expect(page.getByText(messages.Settings.storageScope, { exact: true }).first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (locale === 'es') await page.locator('[aria-labelledby="theme-save-title"]').screenshot({ path: testInfo.outputPath('save-confirmed.png') });
  });
}
