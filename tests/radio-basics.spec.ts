import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('**/api/auth/me', (route) => route.fulfill({ json: { user: null } }));
});

test('DC lesson preserves the circuit laws when changing connections and opening a branch', async ({ page }) => {
  const errors: string[] = [];
  const external: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (request) => {
    if (/^https?:/.test(request.url()) && new URL(request.url()).hostname !== '127.0.0.1') external.push(request.url());
  });
  await page.goto('/es/radio/lecciones/laboratory');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Laboratorio');
  const lab = page.getByTestId('dc-circuit-lab');
  const readings = lab.locator('dd');
  await expect(readings.nth(0)).toHaveText('66,67 Ω');
  await expect(readings.nth(1)).toHaveText('180 mA');
  await expect(readings.nth(2)).toHaveText('2,16 W');
  await expect(lab.getByRole('row').nth(1)).toContainText('120 mA');
  await expect(lab.getByRole('row').nth(2)).toContainText('60 mA');

  await lab.getByRole('switch', { name: 'R2 conectada' }).click();
  await expect(readings.nth(0)).toHaveText('100 Ω');
  await expect(readings.nth(1)).toHaveText('120 mA');
  await expect(lab.getByRole('row').nth(2)).toContainText('0 mA');

  await lab.getByText('Serie', { exact: true }).click();
  await expect(readings.nth(0)).toHaveText('∞ Ω');
  await expect(readings.nth(1)).toHaveText('0 mA');
  await lab.getByRole('switch', { name: 'R2 conectada' }).click();
  await expect(readings.nth(1)).toHaveText('40 mA');
  await expect(readings.nth(2)).toHaveText('0,48 W');
  await expect(lab.getByRole('row').nth(1).locator('td').first()).toHaveText('4 V');
  await expect(lab.getByRole('row').nth(2).locator('td').first()).toHaveText('8 V');

  await lab.getByRole('switch', { name: 'Fuente encendida' }).click();
  await expect(readings.nth(0)).toHaveText('300 Ω');
  await expect(readings.nth(1)).toHaveText('0 mA');
  await expect(readings.nth(2)).toHaveText('0 W');
  await lab.getByRole('button', { name: /Restablecer/ }).click();
  await expect(readings.nth(1)).toHaveText('180 mA');
  await lab.getByRole('slider', { name: 'Resistencia R2' }).press('End');
  await expect(readings.nth(1)).toHaveText('132 mA');
  await expect(lab.getByRole('row').nth(1)).toContainText('120 mA');
  await expect(lab.getByRole('row').nth(2)).toContainText('12 mA');
  expect(errors).toEqual([]);
  expect(external).toEqual([]);
});

test('practice explains mistakes, accepts a retry and resets answers', async ({ page }) => {
  await page.goto('/es/radio/lecciones/practice');
  const practice = page.locator('#practice');
  await practice.getByRole('radio', { name: 'Tiene 0 V porque no circula corriente.' }).check();
  await expect(practice.getByText('Revisemos la idea', { exact: true })).toBeVisible();
  await expect(practice.getByText(/Puede existir sin corriente/)).toBeVisible();
  await practice.getByRole('radio', { name: 'Tiene 12 V entre bornes y entrega 0 A.' }).check();
  await practice.getByRole('radio', { name: '40 mA por ambos.' }).check();
  await practice.getByRole('radio', { name: '120 mA: conserva la misma tensión.' }).check();
  await practice.getByRole('radio', { name: 'Se cuadruplica.' }).check();
  await expect(practice.getByRole('status')).toHaveText('4 de 4 respuestas correctas');
  await practice.getByRole('button', { name: 'Reiniciar respuestas' }).click();
  await expect(practice.getByRole('status')).toHaveText('0 de 4 respuestas correctas');
  await expect(practice.locator('input:checked')).toHaveCount(0);
});

test('lesson is discoverable from the Explore catalog and Ohm calculator', async ({ page }) => {
  await page.goto('/es/explore');
  await expect(page.locator('[data-app-ready="true"]')).toBeVisible();
  await page.getByRole('textbox', { name: 'Buscar por nombre o tarea…' }).fill('radioaficionado');
  await page.locator('main a[href="/es/radio"]').first().click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Electricidad para radioaficionados');
  await page.goto('/es/workbench/ohms-law');
  await expect(page.locator('[data-app-ready="true"]')).toBeVisible();
  await page.locator('main a[href="/es/radio"]').click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Electricidad para radioaficionados');
  await expect(page.getByTestId('radio-lesson-list').getByRole('link')).toHaveCount(9);
  await expect(page.getByTestId('radio-resource-list').getByRole('link')).toHaveCount(4);
});

for (const locale of ['en', 'de', 'it']) {
  test(`simulator renders translated content on its own page in ${locale}`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`/${locale}/radio/lecciones/laboratory`);
    await expect(page.getByTestId('dc-circuit-lab')).toBeVisible();
    await expect(page.locator('[data-radio-page="laboratory"]')).not.toContainText('RadioBasics.');
    await expect(page.getByTestId('radio-glossary')).toHaveCount(0);
    await expect(page.getByRole('heading', { level: 1 })).not.toContainText('Electricidad para radioaficionados');
    expect(errors).toEqual([]);
  });
}
