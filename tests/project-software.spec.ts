import { expect, test } from '@playwright/test';

test('software pages expose their features without JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
  const page = await context.newPage();
  for (const slug of ['pad', 'btdac']) {
    await page.goto(`/es/projects/${slug}/software`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await expect(page.locator('#setup')).toBeVisible();
    await expect(page.locator('#availability')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Cableado y pinout' })).toHaveAttribute('href', `/es/pinouts/${slug}`);
  }
  await context.close();
});

test('PAD project links to software and the page fits mobile screens', async ({ page }) => {
  await page.goto('/es/projects/pad');
  await page.getByRole('link', { name: 'PAD: un escritorio que responde a vos' }).click();
  await expect(page).toHaveURL(/\/es\/projects\/pad\/software$/);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('#editor')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
