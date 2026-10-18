import { test, expect, type Page } from '@playwright/test';
import { createNote, createSong, serializeSong, type ChiptuneSong } from '../lib/workbench/chiptune';

const readSong = (page: Page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem('hios-workbench-chiptune')!).song as ChiptuneSong);

async function open(page: Page) {
  const song = createSong();
  song.tracks[0].notes = [0, 480, 960, 1440].map((start) => createNote(60, start, 240, 100));
  await page.addInitScript((raw) => {
    if (!sessionStorage.getItem('seeded')) {
      localStorage.setItem('hios-workbench-chiptune', raw);
      sessionStorage.setItem('seeded', '1');
    }
  }, serializeSong(song));
  await page.goto('/es/composer');
  await expect(page.getByLabel('Nombre de la canción', { exact: true })).toBeVisible();
}

// Solo scroll vertical de la página: scrollIntoView también desplazaría el carril en X.
const centerVertically = (page: Page, label: string) =>
  page.getByLabel(label, { exact: true }).evaluate((el) => {
    window.scrollBy(0, el.getBoundingClientRect().top - window.innerHeight / 2);
  });

const rulerBox = async (page: Page) => {
  const ruler = page.getByTitle(/Arrastrá para marcar el loop/);
  await ruler.scrollIntoViewIfNeeded();
  return (await ruler.boundingBox())!;
};

test('dragging the ruler sets a loop region that playback stays inside and that persists', async ({ page }) => {
  await open(page);
  const box = await rulerBox(page);
  const bar = 26 * 16; // STEP_W * 16 pasos por compás de 4/4
  await page.mouse.move(box.x + bar + 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + bar * 2 - 2, box.y + box.height / 2, { steps: 6 });
  await page.mouse.up();
  await expect(page.getByRole('button', { name: 'Región 2–3 ✕' })).toBeVisible();
  await expect.poll(async () => (await readSong(page)).loopRegion).toEqual({ start: 1920, end: 3840 });

  await page.getByRole('button', { name: 'Reproducir', exact: true }).click();
  await expect.poll(async () => page.getByLabel('Posición', { exact: true }).textContent()).toMatch(/^2\./);
  for (let i = 0; i < 5; i++) {
    await expect(page.getByLabel('Posición', { exact: true })).toHaveText(/^2\./);
    await page.waitForTimeout(150);
  }
  await page.getByRole('button', { name: 'Detener', exact: true }).click();

  await page.reload();
  await expect(page.getByRole('button', { name: 'Región 2–3 ✕' })).toBeVisible();
  await page.getByRole('button', { name: 'Región 2–3 ✕' }).click();
  await expect(page.getByText('Arrastrá sobre la regla de compases para marcar un loop.')).toBeVisible();
  await expect.poll(async () => (await readSong(page)).loopRegion).toBeUndefined();
});

test('the velocity lane paints one note and the pan lane edits a whole range selection', async ({ page }) => {
  await open(page);
  const lane = page.getByLabel('Carril de intensidad', { exact: true });
  await centerVertically(page, 'Carril de intensidad');
  const box = (await lane.boundingBox())!;
  await page.mouse.click(box.x + 13, box.y + 2);
  const field = (key: 'velocity' | 'pan' | 'offset', fallback: number) => async () =>
    (await readSong(page)).tracks[0].notes.map((n) => n[key] ?? fallback);
  await expect.poll(field('velocity', 0)).toEqual([127, 100, 100, 100]);

  await page.getByRole('radiogroup', { name: 'Modo de edición' }).getByText('Seleccionar rango').click();
  await centerVertically(page, 'Piano roll');
  const piano = page.getByLabel('Piano roll', { exact: true });
  const roll = (await piano.boundingBox())!;
  const grid = { x: roll.x + 46 + 2, y: roll.y + roll.height / 2 };
  await page.mouse.move(grid.x, grid.y);
  await page.mouse.down();
  await page.mouse.move(grid.x + 26 * 9, grid.y, { steps: 6 });
  await page.mouse.up();
  await expect(page.getByText('3 notas seleccionadas: los cambios se aplican a todas.')).toBeVisible();

  await page.getByRole('radiogroup', { name: 'Carril bajo el piano roll' }).getByText('Paneo').click();
  await centerVertically(page, 'Carril de paneo');
  const panLane = page.getByLabel('Carril de paneo', { exact: true });
  const panBox = (await panLane.boundingBox())!;
  await page.mouse.move(panBox.x + 13, panBox.y + 1);
  await page.mouse.down();
  await page.mouse.move(panBox.x + 26 * 13, panBox.y + 1, { steps: 10 });
  await page.mouse.up();
  // Solo las 3 notas del rango; la cuarta (fuera) queda en el centro.
  await expect.poll(field('pan', 0)).toEqual([1, 1, 1, 0]);
  await expect(page.getByText('Paneo · 100% der')).toBeVisible();

  await page.getByLabel('Retraso de nota', { exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await expect.poll(field('offset', 0)).toEqual([5, 5, 5, 0]);
});
