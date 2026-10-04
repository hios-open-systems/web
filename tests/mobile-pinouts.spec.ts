import { test, expect } from '@playwright/test';

test('all modules remain navigable and readable on small screens', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/es/pinouts#esp32-s3-devkitc-1');
  const selector = page.locator('main select');
  await expect(selector).toBeVisible();
  const ids = await selector.locator('option').evaluateAll((options) => options.map((option) => option.getAttribute('value')!));
  expect(ids).toHaveLength(15);
  for (const id of ids) {
    await selector.selectOption(id);
    await expect(page).toHaveURL(new RegExp(`#${id}$`));
    await expect(page.locator('#pinout-detail h2')).toBeVisible();
    await expect(page.locator('#pinout-detail svg')).toHaveCount(1);
    if (id.startsWith('esp32')) {
      const numbers = await page.locator('#pinout-detail svg [data-pin-number]').evaluateAll((nodes) => nodes.map((node) => Number(node.textContent)));
      const count = id === 'esp32-s3-devkitc-1' ? 44 : 38;
      expect([...numbers].sort((a, b) => a - b)).toEqual(Array.from({ length: count }, (_, index) => index + 1));
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  expect(errors).toEqual([]);
});

test('deep links, history, physical header identities and diagram enlargement', async ({ page }) => {
  await page.goto('/es/pinouts#esp32-wroom-32');
  await expect(page.locator('#pinout-detail h2')).toHaveText('ESP32-WROOM-32 DevKit');
  const numbers = await page.locator('#pinout-detail svg [data-pin-number]').evaluateAll((nodes) => nodes.map((node) => Number(node.textContent)));
  expect(numbers).toHaveLength(38);
  expect(new Set(numbers).size).toBe(38);
  expect([...numbers].sort((a, b) => a - b)).toEqual(Array.from({ length: 38 }, (_, index) => index + 1));
  await page.getByRole('button', { name: 'Ampliar', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Ampliar', exact: true })).toHaveAttribute('aria-pressed', 'true');
  expect(await page.locator('#pinout-detail svg').evaluate((svg) => svg.getBoundingClientRect().width)).toBeGreaterThanOrEqual(700);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator('main select').selectOption('jack-trs');
  await page.goBack();
  await expect(page.locator('#pinout-detail h2')).toHaveText('ESP32-WROOM-32 DevKit');
  await page.reload();
  await expect(page.locator('main select')).toHaveValue('esp32-wroom-32');
});
