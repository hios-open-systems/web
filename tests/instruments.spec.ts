import { expect, test } from '@playwright/test';

test('RC scope agrees with its cutoff, freezes motion and updates paused parameter edits', async ({ page }) => {
  await page.goto('/es/calculators?tab=rc');
  const lab = page.locator('[data-rc-lab]');
  await lab.getByRole('button', { name: 'Llevar entrada a fc' }).click();
  await expect(lab.locator('[data-rc-readouts]')).toContainText('-3.01 dB');
  await expect(lab.locator('[data-rc-readouts]')).toContainText('-45.0°');
  const output = lab.locator('[data-trace-id="vout"]');
  await lab.getByRole('button', { name: 'Pausar visor' }).click();
  const frozen = await output.getAttribute('d');
  await page.waitForTimeout(120);
  await expect(output).toHaveAttribute('d', frozen!);
  await lab.getByLabel('Frecuencia de entrada (Hz)', { exact: true }).fill('1000');
  await lab.getByLabel('Frecuencia de entrada (Hz)', { exact: true }).press('Tab');
  await expect(output).not.toHaveAttribute('d', frozen!);
  await expect(lab.getByRole('button', { name: 'Reanudar visor' })).toBeVisible();
  await expect(page).toHaveURL(/rcInputHz=1000/);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.reload();
  await expect(lab.getByLabel('Frecuencia de entrada (Hz)', { exact: true })).toHaveValue('1000');
});

test('pinout clocks use physical pin names and update slot width without changing WS frequency', async ({ page }) => {
  await page.goto('/es/pinouts#pcm5102');
  const lab = page.locator('[data-pinout-signal-lab]');
  await expect(lab).toContainText('CH1 · BCK (BCLK)');
  await expect(lab).toContainText('CH2 · LRCK (WS)');
  await expect(lab.locator('[data-i2s-readouts]')).toContainText('3.072MHz');
  await lab.getByRole('button', { name: 'Pausar visor' }).click();
  // Ant Design overlays the combobox input with its visible selected value.
  await lab.getByTitle('32', { exact: true }).click();
  await expect(lab.getByRole('combobox', { name: 'Bits por ranura de canal', exact: true })).toHaveAttribute('aria-expanded', 'true');
  await page.getByTitle('16', { exact: true }).click();
  await expect(lab.locator('[data-i2s-readouts]')).toContainText('1.536MHz');
  await expect(lab.locator('[data-i2s-readouts]')).toContainText('LRCK = 48kHz');
  await expect(lab.getByRole('button', { name: 'Reanudar visor' })).toBeVisible();
  await expect(page.locator('[data-pinout-diagram] svg')).toHaveCount(1);
});

test('QPSK mobile selector shows only the requested screen', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/en/workbench/qpsk-modulator');
  await page.getByRole('button', { name: 'X-Y', exact: true }).click();
  const canvases = page.locator('canvas');
  await expect(canvases.nth(0)).toBeHidden();
  await expect(canvases.nth(1)).toBeVisible();
  await page.getByRole('button', { name: 'Time', exact: true }).click();
  await expect(canvases.nth(0)).toBeVisible();
  await expect(canvases.nth(1)).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
