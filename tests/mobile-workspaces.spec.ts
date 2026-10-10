import { test, expect } from '@playwright/test';

test('saved resources and organization remain usable on small screens', async ({ page }, testInfo) => {
  await page.route('**/api/auth/me', route => route.fulfill({ json: { user: null } }));
  await page.goto('/es/explore');
  await page.getByRole('textbox', { name: 'Buscar por nombre o tarea…' }).fill('metronome');
  await page.getByRole('button', { name: 'Agregar al espacio', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Nuevo espacio', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Guardado', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Mi espacio Seguir trabajando', exact: true }).click();
  await page.getByRole('button', { name: 'Organizar', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Metrónomo', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Quitar', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(2);
  await page.screenshot({ path: testInfo.outputPath('populated-space.png') });
});

for (const route of ['/en/workbench', '/en/workbench/spaces', '/en/workbench/payload', '/en/explore']) {
  test(`workspace layout ${route}`, async ({ page }, testInfo) => {
    await page.route('**/api/auth/me', route => route.fulfill({ json: { user: null } }));
    await page.goto(route);
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
    if (route.endsWith('payload')) await expect(page.getByRole('textbox', { name: 'Input' })).toBeEnabled();
    if (route.endsWith('explore')) await expect(page.getByRole('button', { name: 'Add to space' }).first()).toBeEnabled();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    expect(overflow).toBeLessThanOrEqual(2);
    await page.screenshot({ path: testInfo.outputPath('layout.png') });
  });
}
