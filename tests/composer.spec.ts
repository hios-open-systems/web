import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { generateSong } from '../lib/workbench/chiptuneGenerator';
import { createSong, serializeSong, type ChiptuneSong } from '../lib/workbench/chiptune';

const readSong = (page: Page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem('hios-workbench-chiptune')!).song as ChiptuneSong);
async function open(page: Page, empty = false) {
  if (empty)
    await page.addInitScript(
      (raw) => localStorage.setItem('hios-workbench-chiptune', raw),
      serializeSong(createSong()),
    );
  await page.goto('/es/composer');
  await expect(page.getByLabel('Nombre de la canción', { exact: true })).toBeVisible();
}

test('generated songs use repeatable musical content and stay inside the song', () => {
  for (const style of ['adventure', 'arcade', 'dream'] as const) {
    const options = { seed: 'regression', root: 11, bars: 16, style };
    const a = generateSong(options),
      b = generateSong(options);
    const music = (s: ChiptuneSong) =>
      s.tracks.map((t) =>
        t.notes.map(({ pitch, start, duration, velocity }) => ({ pitch, start, duration, velocity })),
      );
    expect(music(a)).toEqual(music(b));
    expect(music(a)).not.toEqual(music(generateSong({ ...options, seed: 'variation' })));
    for (const track of a.tracks)
      for (const note of track.notes) {
        expect(note.pitch).toBeGreaterThanOrEqual(0);
        expect(note.pitch).toBeLessThanOrEqual(127);
        expect(note.start + note.duration).toBeLessThanOrEqual(a.lengthBars * 4 * 480);
      }
  }
});

test('generator, undo and presets preserve the actual edited song', async ({ page }) => {
  await open(page);
  const original = await page.getByLabel('Nombre de la canción', { exact: true }).inputValue();
  await page.getByText('Generar una idea musical', { exact: true }).click();
  await page.getByLabel('Semilla', { exact: true }).fill('prueba');
  await page.getByRole('button', { name: 'Usar esta semilla' }).click();
  await expect(page.getByLabel('Nombre de la canción', { exact: true })).toHaveValue('Aventura · prueba');
  await page.getByRole('button', { name: 'Deshacer', exact: true }).click();
  await expect(page.getByLabel('Nombre de la canción', { exact: true })).toHaveValue(original);
  await page.getByRole('button', { name: 'Rehacer', exact: true }).click();
  await page.getByText('Biblioteca, guardar y abrir proyectos', { exact: true }).click();
  await page.getByRole('button', { name: 'Guardar configuración', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Guardar configuración', exact: true }).click();
  await expect
    .poll(async () => page.evaluate(() => localStorage.getItem('hios-presets-composer')))
    .toContain('s=');
  await page.getByRole('button', { name: 'Nueva canción', exact: true }).click();
  await page.getByRole('button', { name: 'Configuraciones (1)' }).click();
  await page.getByRole('menuitem').first().click();
  await expect(page.getByLabel('Nombre de la canción', { exact: true })).toHaveValue('Aventura · prueba');
});

test('removing the active track selects an editable track and playback survives silence', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await open(page, true);
  await page.getByRole('button', { name: 'Borrar pista', exact: true }).click();
  await expect(page.getByLabel('Nombre de pista', { exact: true })).toHaveValue('Bajo');
  await page.getByRole('button', { name: 'Agregar pista', exact: true }).click();
  await expect(page.getByLabel('Nombre de pista', { exact: true })).toHaveValue('Pista 3');
  await page.getByRole('button', { name: 'Reproducir', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Detener', exact: true })).toBeVisible();
  await expect.poll(async () => page.getByLabel('Posición', { exact: true }).textContent()).not.toBe('1.1');
  await page.getByRole('button', { name: 'Detener', exact: true }).click();
  await expect(page.getByLabel('Posición', { exact: true })).toHaveText('1.1');
  expect(errors).toEqual([]);
});

test('WAV and MP3 downloads decode to audible audio, MIDI and project download round trip', async ({
  page,
}) => {
  test.setTimeout(90000);
  await open(page);
  await page.getByLabel('Compases', { exact: true }).fill('1');
  await page.getByLabel('Compases', { exact: true }).press('Tab');
  for (const name of ['Audio WAV', 'Audio MP3', 'MIDI', 'Proyecto editable (.json)']) {
    const pending = page.waitForEvent('download');
    await page.getByRole('button', { name, exact: true }).click();
    const download = await pending;
    const bytes = await readFile((await download.path())!);
    expect(bytes.length).toBeGreaterThan(50);
    if (name.startsWith('Audio')) {
      const audio = await page.evaluate(async (base64) => {
        const context = new AudioContext();
        try {
          const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
          const buffer = await context.decodeAudioData(bytes.buffer);
          return {
            duration: buffer.duration,
            peak: buffer.getChannelData(0).reduce((m, v) => Math.max(m, Math.abs(v)), 0),
          };
        } finally {
          await context.close();
        }
      }, bytes.toString('base64'));
      expect(audio.duration).toBeGreaterThan(1);
      expect(audio.peak).toBeGreaterThan(0.01);
    } else if (name === 'MIDI') expect(bytes.subarray(0, 4).toString()).toBe('MThd');
    else {
      await page.getByText('Biblioteca, guardar y abrir proyectos', { exact: true }).click();
      await page.getByRole('button', { name: 'Nueva canción', exact: true }).click();
      await page
        .locator('input[type=file]')
        .setInputFiles({ name: 'saved.json', mimeType: 'application/json', buffer: bytes });
      await expect(page.getByLabel('Nombre de la canción', { exact: true })).toHaveValue(
        JSON.parse(bytes.toString()).song.name,
      );
    }
  }
  await expect.poll(async () => (await readSong(page)).lengthBars).toBe(1);
});

test('invalid imports leave the current composition intact', async ({ page }) => {
  await open(page);
  const name = await page.getByLabel('Nombre de la canción', { exact: true }).inputValue();
  await page.getByText('Biblioteca, guardar y abrir proyectos', { exact: true }).click();
  await page
    .locator('input[type=file]')
    .setInputFiles({
      name: 'broken.json',
      mimeType: 'application/json',
      buffer: Buffer.from('{"version":1,"song":{"tracks":[null]}}'),
    });
  await expect(page.getByRole('alert').filter({ hasText: 'No se pudo abrir' })).toBeVisible();
  await expect(page.getByLabel('Nombre de la canción', { exact: true })).toHaveValue(name);
});

test('live edits keep playback running across tempo changes, mute and loop boundaries', async ({ page }) => {
  await open(page);
  await page.getByLabel('Compases', { exact: true }).fill('1');
  await page.getByLabel('Tempo', { exact: true }).fill('300');
  await page.getByLabel('Tempo', { exact: true }).press('Tab');
  await page.getByRole('button', { name: 'Reproducir', exact: true }).click();
  await expect.poll(async () => page.getByLabel('Posición', { exact: true }).textContent()).not.toBe('1.1');
  await page.getByRole('button', { name: 'Silenciar', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Detener', exact: true })).toBeVisible();
  await page.getByLabel('Tempo', { exact: true }).fill('120');
  await page.getByLabel('Tempo', { exact: true }).press('Tab');
  await page.getByRole('button', { name: 'Activar sonido', exact: true }).click();
  await page.getByRole('button', { name: 'Loop', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Reproducir', exact: true })).toBeVisible({ timeout: 5000 });
  await expect(page.getByLabel('Posición', { exact: true })).toHaveText('1.1');
});
