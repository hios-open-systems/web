import { expect, test, type Locator, type Page } from '@playwright/test';
import es from '../messages/es.json';

async function pauseHydration(page: Page) {
  let resume = () => {};
  const pending = new Promise<void>((resolve) => { resume = resolve; });
  await page.route('**/_next/static/**/*.js', async (route) => {
    await pending;
    await route.continue();
  });
  return resume;
}

async function appearance(control: Locator) {
  return control.evaluate((element) => {
    const css = getComputedStyle(element);
    return {
      background: css.backgroundColor, color: css.color, border: css.borderColor,
      radius: css.borderRadius, font: css.fontFamily, shadow: css.boxShadow,
    };
  });
}

async function seedTheme(page: Page, mode: string, skin: string) {
  await page.addInitScript(({ mode, skin }) => {
    localStorage.setItem('theme', mode);
    localStorage.setItem('hios-skin', skin);
    localStorage.setItem('hios-theme-config', JSON.stringify({ version: 1, accent: '#22c55e' }));
  }, { mode, skin });
  await page.route('**/api/auth/me', (route) => route.fulfill({ json: { user: null } }));
}

for (const mode of ['light', 'dark']) {
  for (const skin of ['datasheet', 'terminal', 'blueprint']) {
    test(`controls keep their appearance across hydration: ${mode}/${skin}`, async ({ page }, testInfo) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await seedTheme(page, mode, skin);
      const resume = await pauseHydration(page);
      const input = page.locator('input.ant-input').first();
      const field = page.locator('.ant-input-affix-wrapper').first();
      const button = page.locator('.ant-btn-default').first();
      const primary = page.locator('.ant-btn-primary').first();
      const controls = [field, input, button, primary, page.locator('.ant-select-selector').first()];
      let before: Awaited<ReturnType<typeof appearance>>[];
      try {
        await page.goto('/es/explore', { waitUntil: 'commit' });
        await expect(input).toBeVisible();
        before = await Promise.all(controls.map(appearance));
        expect(before[0].radius).toBe(skin === 'terminal' ? '6px' : '18px');
        const expectedBg = await input.evaluate(() => getComputedStyle(document.documentElement)
          .getPropertyValue(document.documentElement.dataset.theme === 'dark' ? '--hios-bg-secondary' : '--hios-bg-elevated').trim());
        await expect(field).toHaveCSS('background-color', hexToRgb(expectedBg));
        await expect(primary).toHaveCSS('background-color', 'rgb(34, 197, 94)');
      } finally {
        resume();
      }
      // A theme-specific scope means ConfigProvider has adopted the local state.
      await expect(button).toHaveClass(new RegExp(`hios-${mode}-${skin}-22c55e`));
      await expect.poll(() => Promise.all(controls.map(appearance))).toEqual(before!);
      if (skin !== 'datasheet') await page.screenshot({ path: testInfo.outputPath('controls.png') });
      await input.fill('hash');
      await expect(input).toHaveValue('hash');
      expect(errors).toEqual([]);
    });
  }
}

function hexToRgb(hex: string) {
  const channels = [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16));
  return `rgb(${channels.join(', ')})`;
}

test('portaled options and live theme changes follow the same control tokens', async ({ page }) => {
  await seedTheme(page, 'light', 'terminal');
  await page.goto('/es/workbench/settings');
  await expect(page.locator('[data-skin-id="terminal"]')).toHaveAttribute('aria-checked', 'true');
  await page.locator('header .ant-select').first().click();
  const popup = page.locator('.ant-select-dropdown:visible');
  await expect(popup).toHaveCSS('background-color', 'rgb(251, 250, 246)');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: es.Header.darkTheme, exact: true }).click();
  await page.locator('[data-skin-id="blueprint"]').click();
  await page.locator('header .ant-select').first().click();
  await expect(popup).toHaveCSS('background-color', 'rgb(22, 48, 90)');
});
