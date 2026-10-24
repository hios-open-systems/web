import { expect, test, type Page } from '@playwright/test';

async function pauseHydration(page: Page) {
  let resume = () => {};
  const pending = new Promise<void>((resolve) => { resume = resolve; });
  await page.route('**/_next/static/**/*.js', async (route) => {
    await pending;
    await route.continue();
  });
  return resume;
}

async function expectAppearance(page: Page, mode: string, skin: string, accent: string) {
  await expect(page.locator('html')).toHaveAttribute('data-theme', mode);
  await expect(page.locator('html')).toHaveAttribute('data-skin', skin);
  await expect.poll(() => page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--accent').trim(),
  )).toBe(accent);
}

for (const [mode, skin, storedAccent, accent] of [
  ['light', 'terminal', ' #AbC ', '#aabbcc'],
  ['dark', 'blueprint', '#0ea5e9', '#0ea5e9'],
] as const) {
  test(`restores ${mode}/${skin} before hydration or authentication`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.addInitScript(({ mode, skin, storedAccent }) => {
      localStorage.setItem('theme', mode);
      localStorage.setItem('hios-skin', skin);
      localStorage.setItem('hios-theme-config', JSON.stringify({ version: 1, accent: storedAccent }));
    }, { mode, skin, storedAccent });
    await page.route('**/api/auth/me', (route) => route.fulfill({ json: { user: null } }));
    const resume = await pauseHydration(page);
    try {
      await page.goto('/es/workbench/settings', { waitUntil: 'commit' });
      await expect(page.getByRole('heading', { name: 'Configuración', level: 1 })).toBeVisible();
      await expectAppearance(page, mode, skin, accent);
    } finally {
      resume();
    }
    await expect(page.getByTestId('accent-hex-input')).toHaveValue(accent);
    await expect(page.locator(`[data-skin-id="${skin}"]`)).toHaveAttribute('aria-checked', 'true');
    await expectAppearance(page, mode, skin, accent);
    expect(errors).toEqual([]);
  });
}

test('account accent is remembered on a later visit without a session', async ({ page, context }) => {
  let signedIn = true;
  await page.route('**/api/auth/me', (route) => route.fulfill({ json: {
    user: signedIn ? { id: 'theme-test', login: 'theme-test', name: null, avatar_url: null } : null,
  } }));
  await page.route('**/api/user/settings', (route) => route.fulfill({ json: {
    settings: { themeAccent: '#8b5cf6', updatedAt: 1 },
  } }));
  await page.goto('/es/workbench/settings');
  await expect(page.getByTestId('accent-hex-input')).toHaveValue('#8b5cf6');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('hios-theme-config') ?? 'null')))
    .toEqual({ version: 1, accent: '#8b5cf6' });

  signedIn = false;
  await context.clearCookies();
  await page.evaluate(() => sessionStorage.clear());
  const resume = await pauseHydration(page);
  try {
    await page.reload({ waitUntil: 'commit' });
    await expectAppearance(page, 'dark', 'datasheet', '#8b5cf6');
  } finally {
    resume();
  }
  await expect(page.getByTestId('accent-hex-input')).toHaveValue('#8b5cf6');
  await expectAppearance(page, 'dark', 'datasheet', '#8b5cf6');
});

for (const raw of ['{broken', '{"version":2,"accent":"#abc"}', '{"version":1,"accent":"red"}']) {
  test(`invalid accent storage preserves mode and skin: ${raw}`, async ({ page }) => {
    await page.addInitScript((raw) => {
      localStorage.setItem('theme', 'light');
      localStorage.setItem('hios-skin', 'terminal');
      localStorage.setItem('hios-theme-config', raw);
    }, raw);
    const resume = await pauseHydration(page);
    try {
      await page.goto('/es/workbench/settings', { waitUntil: 'commit' });
      await expectAppearance(page, 'light', 'terminal', '#f59e0b');
    } finally {
      resume();
    }
    await expect(page.getByTestId('accent-hex-input')).toHaveValue('#f59e0b');
  });
}

test('blocked storage falls back safely and still allows changing the theme', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() { throw new DOMException('Storage blocked', 'SecurityError'); },
    });
  });
  await page.route('**/api/auth/me', (route) => route.fulfill({ json: { user: null } }));
  await page.goto('/es/workbench/settings');
  await expectAppearance(page, 'dark', 'datasheet', '#f59e0b');
  await page.locator('[data-preset-id="cyan"]').click();
  await expectAppearance(page, 'dark', 'datasheet', '#0ea5e9');
  expect(errors).toEqual([]);
});
