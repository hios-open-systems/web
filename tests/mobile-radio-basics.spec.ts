import { expect, test } from '@playwright/test';

test('radio lesson and lab fit narrow screens and remain operable', async ({ page }, testInfo) => {
  if (testInfo.project.name === 'mobile-360') await page.setViewportSize({ width: 320, height: 844 });
  await page.route('**/api/auth/me', (route) => route.fulfill({ json: { user: null } }));
  await page.goto('/es/workbench/radio-basics');
  const lab = page.getByTestId('dc-circuit-lab');
  await expect(lab).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole('navigation', { name: 'Contenido de esta sección' }).getByRole('link', { name: 'Laboratorio', exact: true }).click();
  await expect(page).toHaveURL(/#laboratory$/);
  await lab.getByText('Serie', { exact: true }).click();
  await expect(lab.locator('dd').nth(1)).toHaveText('40 mA');
  await lab.getByRole('switch', { name: 'R2 conectada' }).click();
  await expect(lab.locator('dd').nth(1)).toHaveText('0 mA');
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  const glossary = page.getByTestId('radio-glossary');
  await glossary.getByRole('textbox', { name: 'Buscar un término' }).fill('DMR');
  await expect(glossary.locator('[data-glossary-entry="dmr"]')).toContainText('12,5 kHz');
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
