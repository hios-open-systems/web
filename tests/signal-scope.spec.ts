import { expect, test } from '@playwright/test';

test('generator scope follows generated audio, pauses independently and clears on stop', async ({ page }) => {
  await page.goto('/es/workbench/tone-generator');
  const trace = page.locator('[data-live-trace]');
  await expect(trace).toHaveAttribute('d', 'M20 115H440');
  await page.getByRole('button', { name: 'Reproducir señal' }).click();
  await expect(page.locator('[data-live-scope]')).toContainText('Reproduciendo');
  await expect.poll(async () => {
    const d = await trace.getAttribute('d');
    return d !== 'M20 115H440' && /,1(0\d|2\d)\./.test(d ?? '');
  }).toBe(true);
  await page.getByRole('button', { name: 'Pausar visor' }).click();
  const frozen = await trace.getAttribute('d');
  await expect(page.getByRole('button', { name: 'Detener señal' })).toBeVisible();
  await page.waitForTimeout(100);
  await expect(trace).toHaveAttribute('d', frozen!);
  await page.getByRole('button', { name: 'Reanudar visor' }).click();
  await page.getByRole('button', { name: 'Detener señal' }).click();
  await expect(trace).toHaveAttribute('d', 'M20 115H440');
  await expect(page.locator('[data-live-scope]')).toContainText('Sin señal');
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
