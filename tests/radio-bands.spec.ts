import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('**/api/auth/me', route => route.fulfill({ json: { user: null } }));
});

test('frequency spectrum spans eight families with HF selected and its standard limits', async ({ page }) => {
  await page.goto('/es/workbench/radio-basics/bands');
  const spectrum = page.getByTestId('radio-band-spectrum');
  const detail = page.getByTestId('radio-band-detail');
  await expect(spectrum.locator('button[data-band]')).toHaveCount(8);
  for (const band of ['vlf', 'lf', 'mf', 'hf', 'vhf', 'uhf', 'shf', 'ehf']) {
    await expect(spectrum.locator(`button[data-band="${band}"]`)).toBeVisible();
  }
  await expect(spectrum.locator('button[aria-pressed="true"]')).toHaveCount(1);
  await expect(spectrum.locator('[data-band="hf"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(detail.locator('[lang="en"]')).toHaveText('High Frequency');
  await expect(detail.locator('dd').first()).toHaveText(/3 MHz\s*–\s*30 MHz/);
  await expect(spectrum.locator('[data-band="vlf"]')).toContainText(/3 kHz\s*–\s*30 kHz/);
  await expect(spectrum.locator('[data-band="ehf"]')).toContainText(/30 GHz\s*–\s*300 GHz/);
  await expect(page.locator('[data-radio-lesson] p').filter({ hasText: 'Estas son familias generales' })).toContainText(/no.*(?:autoriz|habilit|permit)/i);
  await expect(page.getByRole('link', { name: 'ENACOM · Normativa y cuadro de bandas', exact: true })).toHaveAttribute('href', 'https://www.enacom.gob.ar/normativa-principal_p2974');
});

test('band selection updates numerical limits and English names using keyboard without external requests', async ({ page }) => {
  const external: string[] = [];
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => {
    if (/^https?:/.test(request.url()) && new URL(request.url()).hostname !== '127.0.0.1') external.push(request.url());
  });
  await page.goto('/es/workbench/radio-basics/bands');
  const spectrum = page.getByTestId('radio-band-spectrum');
  const detail = page.getByTestId('radio-band-detail');
  await spectrum.getByRole('button', { name: /^VHF\b/ }).click();
  await expect(detail.locator('dd').first()).toHaveText(/30 MHz\s*–\s*300 MHz/);
  await expect(detail.locator('[lang="en"]')).toHaveText('Very High Frequency');
  const uhf = spectrum.getByRole('button', { name: /^UHF\b/ });
  await uhf.focus();
  await uhf.press('Enter');
  await expect(uhf).toHaveAttribute('aria-pressed', 'true');
  await expect(spectrum.locator('[data-band="vhf"]')).toHaveAttribute('aria-pressed', 'false');
  await expect(spectrum.locator('button[aria-pressed="true"]')).toHaveCount(1);
  await expect(detail.locator('dd').first()).toHaveText(/300 MHz\s*–\s*3 GHz/);
  await expect(detail.locator('[lang="en"]')).toHaveText('Ultra High Frequency');
  expect(external).toEqual([]);
  expect(errors).toEqual([]);
});

test('the visible spectrum axis precedes the amateur comparison and retains all frequency limits', async ({ page }) => {
  await page.goto('/es/workbench/radio-basics/bands');
  const spectrum = page.getByTestId('radio-band-spectrum');
  const table = page.getByTestId('amateur-band-table');
  await expect(page.getByRole('tab')).toHaveCount(0);
  await expect(spectrum.locator('[aria-hidden="true"] span')).toHaveText([
    '3 kHz', '30 kHz', '300 kHz', '3 MHz', '30 MHz', '300 MHz', '3 GHz', '30 GHz', '300 GHz',
  ]);
  expect(await spectrum.evaluate((element) => {
    const comparison = document.querySelector('[data-testid="amateur-band-table"]');
    return comparison !== null && Boolean(element.compareDocumentPosition(comparison) & Node.DOCUMENT_POSITION_FOLLOWING);
  })).toBe(true);
  for (const [id, range] of [
    ['eighty', /3,5 MHz\s*–\s*4 MHz/], ['forty', /7 MHz\s*–\s*7,3 MHz/],
    ['twenty', /14 MHz\s*–\s*14,35 MHz/], ['two', /144 MHz\s*–\s*148 MHz/],
    ['seventy', /430 MHz\s*–\s*440 MHz/],
  ] as const) {
    await expect(table.locator(`[data-amateur-band="${id}"]`)).toContainText(range);
  }
});

test('selecting an amateur band updates its antennas, technologies and reserved segment notes', async ({ page }) => {
  await page.goto('/es/workbench/radio-basics/bands');
  await page.locator('[data-app-ready="true"]').waitFor();
  const table = page.getByTestId('amateur-band-table');
  const detail = page.getByTestId('amateur-band-detail');
  await expect(detail.getByRole('heading', { name: '40 m', exact: true })).toBeVisible();
  await table.getByRole('button', { name: '70 cm', exact: true }).click();
  await expect(table.getByRole('button', { name: '70 cm', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(table.locator('button[aria-pressed="true"]')).toHaveCount(1);
  await expect(detail.getByRole('heading', { name: '70 cm', exact: true })).toBeVisible();
  await expect(detail.locator('dd').nth(0)).toContainText('Yagi');
  await expect(detail.locator('dd').nth(1)).toContainText('DMR');
  await expect(detail.locator('dd').nth(2)).toContainText('435–438 MHz');
  await expect(detail).toContainText('No hay una ventaja universal de VHF o UHF dentro de edificios');
});
