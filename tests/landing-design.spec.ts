import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

const copy = JSON.parse(readFileSync('messages/es.json', 'utf8'));

test('landing signal responds to shape, frequency and animation controls', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/es');
  await expect(page.getByRole('heading', { level: 1 })).toContainText(copy.Landing.title);
  const signal = page.locator('[data-paused]');
  const original = await signal.locator('[data-signal-wave] path').nth(1).getAttribute('d');
  await page.getByRole('button', { name: 'Cuadrada', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Cuadrada', exact: true })).toHaveAttribute('aria-pressed', 'true');
  expect(await signal.locator('[data-signal-wave] path').nth(1).getAttribute('d')).not.toBe(original);
  await page.getByRole('slider', { name: /Frecuencia/ }).fill('660');
  await expect(signal.locator('output')).toHaveText('660 Hz');
  await page.getByRole('button', { name: 'Pausar animación' }).click();
  await expect(signal).toHaveAttribute('data-paused', 'true');
  await page.getByRole('button', { name: 'Reanudar animación' }).click();
  await expect(signal).toHaveAttribute('data-paused', 'false');
  await expect(page.getByRole('link', { name: 'Abrir generador' })).toHaveAttribute(
    'href',
    '/es/workbench/tone-generator',
  );
  expect(errors).toEqual([]);
});

test('compact save buttons still create a workspace and save a resource', async ({ page }) => {
  await page.goto('/es');
  const area = page.locator('[data-activity="development"]');
  const save = area.getByRole('button', { name: copy.Workspace.addToSpace, exact: true }).first();
  await expect(save).toBeEnabled();
  await save.click();
  await page.getByRole('menuitem', { name: copy.Workspace.new, exact: true }).click();
  await expect(
    area.getByRole('button', {
      name: copy.Workspace.addedToSpace,
      exact: true,
    }),
  ).toHaveCount(1);
});

for (const [theme, skin] of [
  ['dark', 'datasheet'],
  ['dark', 'blueprint'],
  ['light', 'datasheet'],
  ['dark', 'terminal'],
]) {
  test(`${theme}/${skin} fits desktop and mobile`, async ({ page }) => {
    await page.addInitScript(
      ({ theme, skin }) => {
        localStorage.setItem('theme', theme);
        localStorage.setItem('hios-skin', skin);
      },
      { theme, skin },
    );
    await page.goto('/es');
    await expect(page.locator('html')).toHaveAttribute('data-skin', skin);
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
  });
}

test('reduced motion stops the animated trace while controls remain usable', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/es');
  const trace = page.locator('[data-signal-wave] path').last();
  expect(await trace.evaluate((el) => getComputedStyle(el).animationName)).toBe('none');
  await page.getByRole('button', { name: 'Triangular', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Triangular', exact: true })).toHaveAttribute('aria-pressed', 'true');
});
