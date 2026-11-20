import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('**/api/auth/me', (route) => route.fulfill({ json: { user: null } }));
  await page.goto('/es/workbench/radio-basics');
});

test('glossary searches acronyms, meanings and band aliases', async ({ page }) => {
  const glossary = page.getByTestId('radio-glossary');
  const search = glossary.getByRole('textbox', { name: 'Buscar un término' });
  await expect(glossary.getByRole('status')).toHaveText('37 términos encontrados');
  await expect(glossary.locator('[data-glossary-entry]')).toHaveCount(8);
  await search.fill('ptt');
  await expect(glossary.locator('[data-glossary-entry="ptt"]')).toContainText('Push-to-talk');
  await search.fill('2m');
  await expect(glossary.locator('[data-glossary-entry="twoMeters"]')).toContainText('145 MHz');
  await search.fill('confirmacion');
  await expect(glossary.locator('[data-glossary-entry="qsl"]')).toBeVisible();
  await search.fill('DMR');
  await expect(glossary.locator('[data-glossary-entry="dmr"]')).toContainText('12,5 kHz');
  await expect(glossary.locator('[data-glossary-entry="colorCode"]')).toContainText('0 a 15');
});

test('glossary handles QCL cautiously and related terms reset filters', async ({ page }) => {
  const glossary = page.getByTestId('radio-glossary');
  const search = glossary.getByRole('textbox', { name: 'Buscar un término' });
  await search.fill('QCL');
  await expect(search).toHaveValue('QCL');
  await expect(glossary.getByRole('status')).toHaveText('0 términos encontrados');
  await expect(glossary.getByText(/Conservamos «QCL» como tu consulta/)).toBeVisible();
  await glossary.getByRole('button', { name: 'Consultar QSL' }).click();
  await expect(search).toHaveValue('QSL');
  await expect(glossary.locator('[data-glossary-entry="qsl"]')).toBeVisible();
  await search.fill('PTT');
  await glossary.locator('[data-glossary-entry="ptt"]').getByRole('button', { name: 'TX', exact: true }).click();
  await expect(search).toHaveValue('TX');
  await expect(glossary.locator('[data-glossary-entry="tx"]')).toBeVisible();
  await glossary.getByRole('button', { name: 'Limpiar búsqueda y filtros' }).click();
  await expect(glossary.getByRole('status')).toHaveText('37 términos encontrados');
});

test('glossary paginates, filters bands and resets the current page on search', async ({ page }) => {
  const glossary = page.getByTestId('radio-glossary');
  await glossary.getByTitle('2', { exact: true }).click();
  await expect(glossary.locator('[data-glossary-entry="qth"]')).toBeVisible();
  await glossary.getByRole('textbox', { name: 'Buscar un término' }).fill('PTT');
  await expect(glossary.locator('[data-glossary-entry="ptt"]')).toBeVisible();
  await glossary.getByRole('button', { name: 'Limpiar búsqueda y filtros' }).click();
  await glossary.getByText('Todos los temas', { exact: true }).click();
  await page.locator('.ant-select-item-option[title="Bandas"]').click();
  await expect(glossary.getByRole('status')).toHaveText('7 términos encontrados');
  await expect(glossary.locator('[data-glossary-entry="twoMeters"]')).toBeVisible();
  await expect(glossary.getByText(/no bandas enteras habilitadas/)).toBeVisible();
});

test('original Claude PDF is served locally with its review note', async ({ page, request }) => {
  const link = page.getByRole('link', { name: 'Guía de repaso original de Claude · 50 páginas' });
  await expect(link).toHaveAttribute('href', '/downloads/radio/guia-radioaficionado-novicio.pdf');
  await expect(page.getByText(/en la página 41, I.40 conserva/)).toBeVisible();
  const response = await request.get('/downloads/radio/guia-radioaficionado-novicio.pdf');
  expect(response.status()).toBe(200);
  expect((await response.body()).subarray(0, 5).toString()).toBe('%PDF-');
});
