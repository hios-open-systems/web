import { expect, test, type Page } from '@playwright/test';

async function open(page: Page) {
  await page.goto('/es/radio/morse#transmision');
  const trainer = page.locator('#transmision');
  await expect(trainer.getByRole('button', { name: 'Empezar' })).toBeEnabled();
  return trainer;
}

test('holding each paddle sends a series and lights the corresponding tree path', async ({ page }) => {
  const trainer = await open(page);
  for (const [letter, code, key, held] of [
    ['S', '...', 'ArrowLeft', 675], ['M', '--', 'ArrowRight', 780],
  ] as const) {
    await trainer.getByRole('button', { name: letter + ' ' + code, exact: true }).click();
    await expect(trainer.getByRole('status').first()).toHaveText(/Tu turno/);
    await page.clock.install();
    await page.keyboard.down(key);
    await page.clock.runFor(held);
    await page.keyboard.up(key);
    await page.clock.runFor(1100);
    await expect(trainer.getByText(/^Correcto\./)).toBeVisible();
    await expect(trainer.getByRole('button', { name: letter + ' ' + code, exact: true })).toHaveAttribute('aria-pressed', 'true');
  }
});

test('manual key measures duration, grades an error and allows a retry of the same word', async ({ page }) => {
  const trainer = await open(page);
  await trainer.getByLabel('Ejercicio').selectOption('word');
  await trainer.getByLabel('Palabras para practicar').fill('ET');
  await trainer.getByLabel('Tecla manual adicional').selectOption('J');
  await trainer.getByRole('button', { name: 'Empezar' }).click();
  await expect(trainer.getByText('Tu turno.', { exact: false })).toBeVisible();
  await page.clock.install();
  async function manual(key: string, duration: number) {
    await page.keyboard.down(key); await page.clock.runFor(duration); await page.keyboard.up(key);
    await page.clock.runFor(500);
  }
  await manual('ArrowDown', 100); await manual('j', 120);
  await expect(trainer.getByText(/Revisá tu envío/)).toBeVisible();
  await expect(trainer.locator('output')).toContainText('EE');
  await trainer.getByRole('button', { name: 'Repetir objetivo' }).click();
  await expect(trainer.getByText(/Tu turno/)).toBeVisible();
  await manual('ArrowDown', 140); await manual('j', 450);
  await expect(trainer.getByText(/^Correcto\./)).toBeVisible();
  await expect(trainer.locator('output')).toContainText('ET');
});

test('groups respect the selected alphabet, size and speed', async ({ page }) => {
  const trainer = await open(page);
  await trainer.getByLabel('Ejercicio').selectOption('group');
  await trainer.getByLabel('Letras para practicar').fill('K');
  await trainer.getByLabel('Letras por grupo').selectOption('2');
  await trainer.getByRole('slider', { name: /Velocidad/ }).press('ArrowRight');
  await expect(trainer.getByText(/450 pulsos\/min/)).toBeVisible();
  await trainer.getByRole('button', { name: 'Empezar' }).click();
  await expect(trainer.getByText('KK', { exact: true })).toBeVisible();
  await trainer.getByLabel('Letras para practicar').fill('');
  await expect(trainer.getByRole('button', { name: 'Empezar' })).toBeDisabled();
});

test('shared pitch and receiver noise drive the audio nodes and survive reload', async ({ page }) => {
  await page.addInitScript(() => {
    const originalOscillator = AudioContext.prototype.createOscillator;
    AudioContext.prototype.createOscillator = function () {
      const node = originalOscillator.call(this);
      node.addEventListener('ended', () => {
        document.documentElement.dataset.lastPitch = String(Math.round(node.frequency.value));
      });
      return node;
    };
    const originalSource = AudioContext.prototype.createBufferSource;
    AudioContext.prototype.createBufferSource = function () {
      const node = originalSource.call(this);
      document.documentElement.dataset.noise = 'created';
      node.addEventListener('ended', () => { document.documentElement.dataset.noise = 'ended'; });
      return node;
    };
  });
  const trainer = await open(page);
  const tone = trainer.getByRole('slider', { name: /Tono/ });
  const noise = trainer.getByLabel('Fondo de recepción');
  await expect(tone).toHaveValue('650');
  await trainer.getByRole('button', { name: 'E .', exact: true }).click();
  await expect(trainer.getByText(/Tu turno/)).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-last-pitch', '650');
  expect(await page.locator('html').getAttribute('data-noise')).toBeNull();
  await tone.press('End');
  await noise.selectOption('3');
  await expect(page.locator('#traductor').getByLabel('Fondo de recepción')).toHaveValue('3');
  await page.reload();
  await expect(tone).toHaveValue('1000');
  await expect(noise).toHaveValue('3');
  await trainer.getByRole('button', { name: 'S ...', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-noise', 'created');
  await tone.press('ArrowLeft');
  await expect(trainer.getByText(/Tu turno/)).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-last-pitch', '990');
  await expect(page.locator('html')).toHaveAttribute('data-noise', 'ended');
  await trainer.getByRole('button', { name: 'Restablecer sonido original' }).click();
  await expect(tone).toHaveValue('650');
  await expect(noise).toHaveValue('0');
});
