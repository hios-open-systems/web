import { test, expect } from '@playwright/test';

test('desktop search, selection and direct links cover the catalog', async ({ page }) => {
  await page.goto('/es/pinouts#jack-trs');
  const list = page.locator('aside nav');
  await expect(page.locator('#pinout-detail h2')).toContainText('Jack 3.5mm');
  const buttons = list.locator('button[value]');
  await expect(buttons).toHaveCount(15);
  for (let index = 0; index < 15; index++) {
    await buttons.nth(index).click();
    await expect(page.locator('#pinout-detail svg')).toHaveCount(1);
    const names = await page.locator('#pinout-detail [data-signal-name]').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-signal-name')));
    if (names.length > 0) {
      const references = await page.locator('#pinout-detail svg [data-pin-reference]').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-pin-reference')));
      expect(references).toEqual(names);
    }
    await expect(list.locator('[aria-current="true"]')).toHaveCount(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await list.getByRole('textbox').fill('BCLK');
  await expect(buttons).toHaveCount(1);
  await buttons.click();
  await expect(page.locator('#pinout-detail h2')).toHaveText('MAX98357A');
});

test('all locales translate new diagram labels', async ({ page }) => {
  for (const locale of ['en', 'es', 'de', 'it']) {
    await page.goto(`/${locale}/pinouts#pcm5102`);
    await expect(page.locator('#pinout-detail h2')).toHaveText('PCM5102A DAC');
    await expect(page.locator('#pinout-detail')).not.toContainText('Pinouts.functionalDiagram');
    await expect(page.locator('#pinout-detail svg')).toHaveCount(1);
  }
});
