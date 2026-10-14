import { test, expect, type Page } from '@playwright/test';
import {
  createNote,
  createSong,
  parseSong,
  serializeSong,
  type ChiptuneSong,
} from '../lib/workbench/chiptune';
import { generateSong } from '../lib/workbench/chiptuneGenerator';
import {
  canTranspose,
  inScale,
  nearestScalePitch,
  transposeTrack,
  varyMelody,
} from '../lib/workbench/chiptuneMusic';

async function stored(page: Page): Promise<ChiptuneSong> {
  await expect.poll(() => page.evaluate(() => localStorage.getItem('hios-workbench-chiptune'))).not.toBeNull();
  return page.evaluate(() => JSON.parse(localStorage.getItem('hios-workbench-chiptune')!).song as ChiptuneSong);
}

test('melodic variations preserve backing, rhythm, identity, dynamics and settings', () => {
  const song = generateSong({ seed: 'music', root: 2, style: 'arcade', bars: 4 });
  const before = JSON.stringify(song);
  const next = varyMelody(song, song.tracks[0].id, 42);
  expect(next.tracks.slice(1)).toEqual(song.tracks.slice(1));
  expect(next.tracks[0].notes.map((n) => n.pitch)).not.toEqual(song.tracks[0].notes.map((n) => n.pitch));
  expect(next.tracks[0].notes.map(({ pitch, ...n }) => n)).toEqual(
    song.tracks[0].notes.map(({ pitch, ...n }) => n),
  );
  expect(next.tracks[0].notes.every((n) => inScale(n.pitch, song.scale!))).toBe(true);
  expect(next.bpm).toBe(song.bpm);
  expect(next.lengthBars).toBe(song.lengthBars);
  expect(JSON.stringify(song)).toBe(before);
  expect(varyMelody(song, song.tracks[0].id, 42)).toEqual(next);
  expect(varyMelody(song, song.tracks[3].id, 42)).toBe(song);
});

test('transpose is exact and reversible and blocks ranges rather than clipping intervals', () => {
  const song = createSong();
  song.tracks[0].notes = [createNote(60, 0, 240), createNote(67, 240, 240)];
  const moved = transposeTrack(song, song.tracks[0].id, 12);
  expect(moved.tracks[0].notes.map((n) => n.pitch)).toEqual([72, 79]);
  expect(moved.tracks.slice(1)).toEqual(song.tracks.slice(1));
  expect(transposeTrack(moved, song.tracks[0].id, -12)).toEqual(song);
  song.tracks[0].notes[0].pitch = 127;
  expect(canTranspose(song.tracks[0], 1)).toBe(false);
  expect(transposeTrack(song, song.tracks[0].id, 1)).toBe(song);
  song.tracks[0].notes[0].pitch = 0;
  expect(canTranspose(song.tracks[0], -1)).toBe(false);
});

test('scale snapping stays in MIDI range and scale metadata survives project round trip', () => {
  for (const mode of ['major', 'minor'] as const)
    for (let root = 0; root < 12; root++) {
      for (let pitch = 0; pitch < 128; pitch++) {
        const next = nearestScalePitch(pitch, { root, mode });
        expect(next >= 0 && next <= 127 && inScale(next, { root, mode })).toBe(true);
        if (inScale(pitch, { root, mode })) expect(next).toBe(pitch);
      }
    }
  const song = generateSong({ seed: 'persist', root: 8, style: 'arcade', bars: 4 });
  expect(parseSong(serializeSong(song))?.scale).toEqual({ root: 8, mode: 'minor' });
  expect(parseSong(serializeSong(createSong()))).not.toBeNull();
  expect(
    parseSong(JSON.stringify({ version: 1, song: { ...song, scale: { root: 12, mode: 'major' } } })),
  ).toBeNull();
});

test('vary and transpose can be undone independently and guide does not rewrite existing music', async ({
  page,
}) => {
  await page.goto('/es/composer');
  await page.getByText('Generar una idea musical', { exact: true }).click();
  await page.getByRole('button', { name: 'Usar esta semilla', exact: true }).click();
  await expect.poll(async () => (await stored(page)).scale).toEqual({ root: 0, mode: 'major' });
  const before = await stored(page);
  await page.locator('summary').filter({ hasText: 'Escala y melodía' }).click();
  await page.getByRole('button', { name: 'Variar melodía', exact: true }).click();
  await expect.poll(async () => (await stored(page)).tracks[0].notes).not.toEqual(before.tracks[0].notes);
  const varied = await stored(page);
  expect(varied.tracks.slice(1)).toEqual(before.tracks.slice(1));
  await page.getByRole('button', { name: 'Subir una octava', exact: true }).click();
  await expect
    .poll(async () => (await stored(page)).tracks[0].notes.map((n) => n.pitch))
    .toEqual(varied.tracks[0].notes.map((n) => n.pitch + 12));
  await page.getByRole('button', { name: 'Deshacer', exact: true }).click();
  await expect.poll(async () => (await stored(page)).tracks).toEqual(varied.tracks);
  await page.getByRole('button', { name: 'Deshacer', exact: true }).click();
  await expect.poll(async () => (await stored(page)).tracks).toEqual(before.tracks);
  await page.getByLabel('Escala guía', { exact: true }).first().click();
  await page.getByTitle('Menor natural', { exact: true }).click();
  await expect.poll(async () => (await stored(page)).scale?.mode).toBe('minor');
  expect((await stored(page)).tracks).toEqual(before.tracks);
  await page.reload();
  await expect(page.locator('summary').filter({ hasText: 'Escala y melodía' })).toContainText('Do menor');
});
