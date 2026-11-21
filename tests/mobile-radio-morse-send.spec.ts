import { expect, test } from '@playwright/test';

test('sending a touch dit and scrolling the letter tree fits the reading column', async ({ page }) => {
  await page.goto('/es/radio/lecciones/morse');
  await page.getByRole('link', { name: /Abrir la sección Morse/ }).click();
  const trainer = page.locator('#transmision');
  await trainer.getByRole('button', { name: 'E .', exact: true }).tap();
  await expect(trainer.getByText(/Tu turno/)).toBeVisible();
  await trainer.getByRole('button', { name: /←Puntos|← Puntos/ }).tap();
  await expect(trainer.getByText(/^Correcto\./)).toBeVisible();
  await trainer.getByRole('button', { name: 'J .---', exact: true }).tap();
  await expect(trainer.locator('strong')).toHaveText('J');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
