import { test, expect } from '@playwright/test';
test('landing demos and discovery fit small screens', async ({ page }, info) => {
  await page.goto('/es');
  for (const name of ['Oscilador', 'Pinout', 'QPSK', 'Beat']) {
    await page.getByRole('button', { name, exact: true }).click();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  }
  await page.getByRole('button', { name: 'Keys C5 · 1', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Keys C5 · 1', exact: true })).toHaveAttribute('aria-pressed','true');
  await page.screenshot({path:info.outputPath('mobile-demo.png'),fullPage:false});
  await page.goto('/es/workbench');
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  await page.getByRole('link', { name: /Leer un repositorio/ }).click();
  await expect(page.getByLabel('Token de lectura',{exact:true})).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
});
