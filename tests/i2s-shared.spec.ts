import { expect, test, type Locator } from '@playwright/test';
import en from '../messages/en.json';
import es from '../messages/es.json';
import de from '../messages/de.json';
import it from '../messages/it.json';

async function choose(select: Locator, value: string) {
  await select.press('ArrowDown');
  const listId = await select.getAttribute('aria-controls');
  const dropdown = select.page().locator('.ant-select-dropdown').filter({ has: select.page().locator(`[id="${listId}"]`) });
  await dropdown.getByTitle(value, { exact: true }).click();
  await expect(select).toHaveAttribute('aria-expanded', 'false');
}

async function waveform(scope: Locator) {
  return scope.locator('[data-trace-id]').evaluateAll((nodes) => nodes.map((node) => {
    const coordinates = [...(node.getAttribute('d') ?? '').matchAll(/(-?[\d.]+),(-?[\d.]+)/g)].map((match) => [Number(match[1]), Number(match[2])]);
    const start = coordinates[0][0], duration = coordinates.at(-1)![0] - start;
    return { color: node.getAttribute('stroke'), points: coordinates.map(([x, y]) => [(x - start) / duration, y]) };
  }));
}

for (const [locale, copy] of Object.entries({ en, es, de, it })) {
  test(`${locale}: calculator and both physical pinouts share I²S waveforms`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`/${locale}/calculators?tab=i2s&sampleRate=48000&bitDepth=24&i2sSlotBits=32`);
    const scope = page.locator('[data-i2s-scope]');
    const readouts = scope.locator('[data-i2s-readouts]');
    const bclk = scope.locator('[data-trace-id="bclk"]');
    await expect(readouts).toContainText('3.072MHz');
    const initial = await bclk.getAttribute('d');
    await page.getByRole('spinbutton', { name: copy.Calculators.cards.i2s.channels, exact: true }).fill('1');
    await expect(page.getByText(new RegExp(`${copy.Calculators.cards.i2s.payloadRate}: 1.152 Mbps`))).toBeVisible();
    await expect(bclk).toHaveAttribute('d', initial!);
    await choose(page.getByRole('combobox', { name: copy.Calculators.cards.i2s.bits, exact: true }), '16');
    await expect(page.getByText(new RegExp(`${copy.Calculators.cards.i2s.payloadRate}: 0.768 Mbps`))).toBeVisible();
    await expect(bclk).toHaveAttribute('d', initial!);
    await choose(page.getByRole('combobox', { name: copy.Calculators.cards.i2s.bits, exact: true }), '24');
    await choose(page.getByRole('combobox', { name: copy.Calculators.cards.i2s.slotBits, exact: true }), '24');
    await expect(readouts).toContainText('2.304MHz');
    await expect(readouts).toContainText('WS = 48kHz');
    await expect(bclk).not.toHaveAttribute('d', initial!);
    const traces = await waveform(scope);
    for (const [id, clock, word] of [['pcm5102', 'BCK', 'LRCK'], ['max98357a', 'BCLK', 'LRC']]) {
      await page.goto(`/${locale}/pinouts#${id}`);
      await choose(page.getByRole('combobox', { name: copy.Instrument.i2s.slotBits, exact: true }), '24');
      await expect(readouts).toContainText(`${clock} = 2.304MHz`);
      await expect(readouts).toContainText(`${word} = 48kHz`);
      const physical = await waveform(scope);
      for (const [i, trace] of physical.entries()) {
        expect(trace.color).toBe(traces[i].color);
        expect(trace.points).toHaveLength(traces[i].points.length);
        trace.points.forEach(([x, y], j) => {
          expect(x).toBeCloseTo(traces[i].points[j][0], 3);
          expect(y).toBe(traces[i].points[j][1]);
        });
      }
      await expect(scope.getByRole('button', { name: copy.Instrument.resume, exact: true })).toBeVisible();
    }
  });
}

test('I²S saves slot width separately from precision and migrates old shared configurations', async ({ page }) => {
  await page.goto('/en/calculators?tab=i2s&sampleRate=48000');
  await expect(page.locator('[data-i2s-readouts]')).toContainText('1.536MHz');
  await page.goto('/en/calculators?tab=i2s&sampleRate=48000&bitDepth=24');
  await expect(page.locator('[data-i2s-readouts]')).toContainText('2.304MHz');
  await expect(page).toHaveURL(/i2sSlotBits=24/);
  await choose(page.getByRole('combobox', { name: en.Calculators.cards.i2s.slotBits, exact: true }), '32');
  await expect(page.locator('[data-i2s-readouts]')).toContainText('3.072MHz');
  await page.getByRole('button', { name: en.Presets.save, exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: en.Presets.save, exact: true }).click();
  await expect(page).toHaveURL(/i2sSlotBits=32/);
  await page.reload();
  await expect(page.locator('[data-i2s-readouts]')).toContainText('3.072MHz');
  await page.goto('/en/calculators?tab=i2s');
  await page.getByRole('button', { name: `${en.Presets.presets} (1)`, exact: true }).click();
  await page.getByRole('menuitem', { name: new RegExp(en.Presets.defaultName.replace('{n}', '1')) }).click();
  await expect(page).toHaveURL(/i2sSlotBits=32/);
  await expect(page.locator('[data-i2s-readouts]')).toContainText('3.072MHz');
});

test('I²S rejects audio wider than its slot and recovers on valid edits', async ({ page }) => {
  await page.goto('/en/calculators?tab=i2s&sampleRate=48000&bitDepth=32&i2sSlotBits=16');
  const scope = page.locator('[data-i2s-scope]');
  await expect(scope.getByRole('status')).toHaveText(en.Instrument.i2s.invalid);
  await expect(scope.locator('[data-trace-id]')).toHaveCount(0);
  await page.reload();
  await expect(scope.getByRole('status')).toHaveText(en.Instrument.i2s.invalid);
  await choose(page.getByRole('combobox', { name: en.Calculators.cards.i2s.slotBits, exact: true }), '32');
  await expect(scope.locator('[data-i2s-readouts]')).toContainText('3.072MHz');
  await scope.getByRole('button', { name: en.Instrument.pause, exact: true }).click();
  await page.getByRole('spinbutton', { name: en.Calculators.cards.i2s.fs, exact: true }).fill('96000');
  await expect(scope.locator('[data-i2s-readouts]')).toContainText('6.144MHz');
  await expect(scope.locator('[data-i2s-readouts]')).toContainText('WS = 96kHz');
  await expect(scope.getByRole('button', { name: en.Instrument.resume, exact: true })).toBeVisible();
  await page.getByRole('spinbutton', { name: en.Calculators.cards.i2s.fs, exact: true }).fill('');
  await expect(scope.locator('[data-trace-id]')).toHaveCount(0);
  await page.getByRole('spinbutton', { name: en.Calculators.cards.i2s.fs, exact: true }).fill('44100');
  await expect(scope.locator('[data-i2s-readouts]')).toContainText('2.8224MHz');
});

test('built-in audio presets set precision and bus slots together', async ({ page }) => {
  await page.goto('/en/calculators?tab=i2s');
  for (const [name, bclk, slotBits] of [[en.Calculators.presets.audio44, '1.4112MHz', '16'], [en.Calculators.presets.audio48, '3.072MHz', '32']]) {
    await page.getByRole('button', { name: en.Presets.presets, exact: true }).click();
    await page.getByRole('menuitem', { name, exact: true }).click();
    await expect(page.locator('[data-i2s-readouts]')).toContainText(bclk);
    if (slotBits === '32') await expect(page).toHaveURL(/i2sSlotBits=32/);
    await page.reload();
    await expect(page.locator('[data-i2s-readouts]')).toContainText(bclk);
  }
});
