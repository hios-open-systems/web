import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('**/api/auth/me', route => route.fulfill({ json: { user: null } }));
});

test('an open load reflects all power with infinite SWR and adjusting it restores finite results', async ({ page }) => {
  await page.goto('/es/radio/c-antenas-propagacion');
  await page.locator('#roe summary').click();
  const instrument = page.locator('[data-radio-instrument="ROE"]');
  const reading = (label: string) => instrument.locator('[class*="radio_readout__"]').filter({ hasText: label }).locator('strong');
  await instrument.getByRole('button', { name: 'Abierto', exact: true }).click();
  await expect(reading('ROE')).toHaveText('∞');
  await expect(reading('|Γ|')).toHaveText('1');
  await expect(reading('Potencia reflejada')).toHaveText('100 W (100 %)');
  await instrument.getByRole('slider', { name: 'Resistencia de la antena' }).press('Home');
  await expect(reading('ROE')).toHaveText('50 : 1');
  await instrument.getByRole('button', { name: '50 Ω (adaptada)', exact: true }).click();
  await expect(reading('ROE')).toHaveText('1 : 1');
  await expect(reading('Potencia reflejada')).toHaveText('0 W (0 %)');
});

test('resonance readouts use the two exact half-power frequencies', async ({ page }) => {
  await page.goto('/es/radio/a-electricidad');
  await page.locator('#resonancia summary').click();
  const instrument = page.locator('[data-radio-instrument="LC · Q"]');
  await instrument.getByRole('slider', { name: 'Factor de calidad Q' }).press('Home');
  await expect(instrument.getByText('Corte inferior', { exact: true }).locator('..')).toContainText('5,54 MHz');
  await expect(instrument.getByText('Corte superior', { exact: true }).locator('..')).toContainText('9,09 MHz');
});

test('the antenna and human reference stay inside the drawing at HF and UHF', async ({ page }) => {
  await page.goto('/es/radio/c-antenas-propagacion');
  await page.locator('#antenas summary').click();
  const instrument = page.locator('[data-radio-instrument="ANT"]');
  for (const kind of ['Dipolo λ/2', 'Vertical λ/4 + radiales']) {
    await instrument.getByRole('button', { name: kind, exact: true }).click();
    for (const band of ['40 m', '70 cm']) {
      await instrument.getByRole('button', { name: band, exact: true }).click();
      const bounds = await instrument.locator('svg').evaluate(element => {
        const svg = element as SVGSVGElement;
        const box = svg.getBBox();
        const view = svg.viewBox.baseVal;
        return { left: box.x, top: box.y, right: box.x + box.width, bottom: box.y + box.height, width: view.width, height: view.height };
      });
      expect(bounds.left, kind + band).toBeGreaterThanOrEqual(0);
      expect(bounds.top, kind + band).toBeGreaterThanOrEqual(0);
      expect(bounds.right, kind + band).toBeLessThanOrEqual(bounds.width);
      expect(bounds.bottom, kind + band).toBeLessThanOrEqual(bounds.height);
    }
  }
});
