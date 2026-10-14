import { test, expect } from '@playwright/test';
import { inspectMobileLayout } from './helpers/mobile-layout';

test('composer exposes editing and downloads without horizontal page overflow', async ({ page }) => {
  await page.goto('/es/composer');
  await expect(page.getByLabel('Nombre de la canción', { exact: true })).toBeVisible();
  expect(await page.evaluate(inspectMobileLayout)).toEqual([]);
  await page.getByText('Generar una idea musical', { exact: true }).click();
  await page.getByRole('button', { name: 'Generar otra idea', exact: true }).click();
  await expect(page.getByLabel('Nombre de la canción', { exact: true })).toHaveValue(/Aventura/);
  expect(await page.evaluate(inspectMobileLayout)).toEqual([]);
  await page
    .getByRole('button', { name: /^Nota / })
    .first()
    .click();
  await expect(page.getByRole('combobox', { name: 'Duración de nota', exact: true })).toBeVisible();
  expect(await page.evaluate(inspectMobileLayout)).toEqual([]);
  await page.getByRole('button', { name: 'Audio WAV', exact: true }).scrollIntoViewIfNeeded();
  await expect(page.getByRole('button', { name: 'Audio WAV', exact: true })).toBeVisible();
});

test('touch drawing creates one note and dragging edits it without adding another', async ({ page }) => {
  await page.goto('/es/composer');
  await page.getByText('Biblioteca, guardar y abrir proyectos', { exact: true }).click();
  await page.getByRole('button', { name: 'Nueva canción', exact: true }).click();
  const piano = page.getByLabel('Piano roll', { exact: true });
  await piano.scrollIntoViewIfNeeded();
  const box = (await piano.boundingBox())!;
  await page.touchscreen.tap(box.x + 85, box.y + 100);
  const notes = page.getByRole('button', { name: /^Nota / });
  await expect(notes).toHaveCount(1);
  const note = notes.first();
  const initial = (await note.boundingBox())!;
  await page.mouse.move(initial.x + 4, initial.y + initial.height / 2);
  await page.mouse.down();
  await page.mouse.move(initial.x + 56, initial.y + initial.height / 2, { steps: 5 });
  await page.mouse.up();
  await expect(notes).toHaveCount(1);
  await expect(page.getByLabel('Inicio de nota', { exact: true })).toHaveValue('4');
});

test('mobile music assistance snaps drawing and offers comfortable controls without overflow', async ({
  page,
}) => {
  await page.goto('/es/composer');
  await page.getByText('Biblioteca, guardar y abrir proyectos', { exact: true }).click();
  await page.getByRole('button', { name: 'Nueva canción', exact: true }).click();
  await page.locator('summary').filter({ hasText: 'Escala y melodía' }).click();
  await page.getByRole('checkbox', { name: 'Ajustar al dibujar y mover', exact: true }).check();
  expect(await page.evaluate(inspectMobileLayout)).toEqual([]);
  const piano = page.getByLabel('Piano roll', { exact: true });
  await piano.scrollIntoViewIfNeeded();
  await piano.evaluate((el) => {
    el.scrollTop = (el.querySelector('[data-scale-pitch="60"]') as HTMLElement).offsetTop - 200;
  });
  const area = (await piano.boundingBox())!;
  const root = (await page.locator('[data-scale-pitch="60"]').boundingBox())!;
  await page.touchscreen.tap(area.x + 85, root.y - 11);
  await expect(page.getByRole('button', { name: 'Nota C4', exact: true })).toHaveCount(1);
  await page.getByRole('button', { name: 'Subir un semitono', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Nota C#4', exact: true })).toHaveCount(1);
  expect(await page.evaluate(inspectMobileLayout)).toEqual([]);
  const up = await page.getByRole('button', { name: 'Subir un semitono', exact: true }).boundingBox();
  if (page.viewportSize()!.width < 600) expect(up!.height).toBeGreaterThanOrEqual(44);
  await page.getByRole('checkbox', { name: 'Ver escala en el piano', exact: true }).uncheck();
  await expect(page.locator('[data-scale-pitch]')).toHaveCount(0);
});
