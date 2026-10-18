import { test, expect, type Page } from '@playwright/test';
import type { ChiptuneSong } from '../lib/workbench/chiptune';

// El guardado es diferido: se lee con poll hasta que llega a localStorage.
const readSong = (page: Page) =>
  page.evaluate(() => {
    const raw = localStorage.getItem('hios-workbench-chiptune');
    return raw ? (JSON.parse(raw).song as ChiptuneSong) : null;
  });
const sounds = (page: Page) => async () => (await readSong(page))?.tracks.map((t) => t.sound ?? null) ?? [];

const combo = (page: Page, label: string) => page.getByRole('combobox', { name: label, exact: true });

async function pick(page: Page, label: string, option: string) {
  await combo(page, label).click({ force: true });
  await page.locator('.ant-select-dropdown:visible').getByText(option, { exact: true }).click();
}

test('a rock idea with real sound uses sampled guitars and drums, loads them and exports a WAV', async ({ page }) => {
  const samples: { url: string; status: number }[] = [];
  page.on('response', (r) => {
    if (r.url().includes('/samples/')) samples.push({ url: r.url(), status: r.status() });
  });
  await page.goto('/es/composer');
  await pick(page, 'Estilo musical', 'Retro Rock (Guitarra)');
  await expect(combo(page, 'Tipo de sonido')).toBeAttached();
  await page.getByRole('button', { name: 'Generar otra idea' }).click();

  await expect.poll(sounds(page)).toEqual(expect.arrayContaining(['drive-guitar', 'acoustic-kit', 'finger-bass']));
  await expect(page.getByLabel(/^Pista /).filter({ hasText: 'Guitarra distorsionada' }).first()).toBeVisible();

  // La precarga arranca sola; todas las respuestas tienen que ser 200.
  await expect.poll(() => samples.filter((s) => s.url.includes('/acoustic-kit/')).length).toBeGreaterThanOrEqual(8);
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: /WAV/ }).first().click();
  expect((await download).suggestedFilename()).toMatch(/\.wav$/);
  expect(samples.filter((s) => s.status !== 200)).toEqual([]);
});

test('the track sound select swaps synth for a sample and back, and filters drum kits', async ({ page }) => {
  await page.goto('/es/composer');
  await expect(combo(page, 'Sonido')).toBeAttached();
  await pick(page, 'Sonido', 'Sonido: Piano de cola');
  await expect.poll(async () => (await sounds(page)())[0]).toBe('piano');

  await combo(page, 'Sonido').click({ force: true });
  await expect(page.locator('.ant-select-dropdown:visible').getByText('Sonido: Batería acústica')).toHaveCount(0);
  await page.locator('.ant-select-dropdown:visible').getByText('Sonido: synth retro', { exact: true }).click();
  await expect.poll(async () => (await sounds(page)())[0]).toBeNull();
});
