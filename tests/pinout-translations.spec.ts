import { expect, test } from '@playwright/test';
import type { BreakoutCopy } from '../config/pinouts/modules/localize';
import en from '../messages/en.json';
import es from '../messages/es.json';
import de from '../messages/de.json';
import it from '../messages/it.json';
import { inspectMobileLayout } from './helpers/mobile-layout';

const plain = (text: string) => text.replace(/[*`]/g, '');

for (const [locale, copy] of Object.entries({ en, es, de, it })) {
  test(`${locale}: every catalog entry renders its complete localized content`, async ({ page }) => {
    test.setTimeout(60_000);
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => { if (/MISSING_MESSAGE|INVALID_MESSAGE/.test(message.text())) errors.push(message.text()); });
    await page.goto(`/${locale}/pinouts`);
    const detail = page.locator('#pinout-detail');
    for (const [id, module] of Object.entries(copy.Pinouts.Modules) as [string, BreakoutCopy][]) {
      await page.locator(`aside button[value="${id}"]`).click();
      await expect(detail.getByRole('heading', { level: 2 })).toHaveText(module.name);
      await expect(detail).toContainText(module.description);
      for (const pin of module.pins) {
        if (pin.to) await expect(detail).toContainText(plain(pin.to));
        if (pin.note) await expect(detail).toContainText(plain(pin.note));
      }
      for (const note of module.notes ?? []) {
        await expect(detail).toContainText(note.title);
        await expect(detail).toContainText(plain(note.body));
      }
      for (const table of [module.gain, module.channel, module.jumpers]) if (table) {
        for (const heading of table.head) await expect(detail.getByRole('columnheader', { name: heading, exact: true })).toBeVisible();
        for (const row of table.rows) for (const cell of row) await expect(detail).toContainText(plain(cell));
      }
      if (id === 'esp32-s3-devkitc-1') {
        await expect(detail.getByRole('columnheader', { name: copy.Pinouts.gpioFunctions, exact: true })).toHaveCount(2);
        await expect(detail).toContainText(copy.Pinouts.Functions.nc);
      }
      await expect(detail.locator('[data-pinout-signal-lab]')).toHaveCount(['pcm5102', 'max98357a'].includes(id) ? 1 : 0);
    }
    await page.locator('aside').getByRole('textbox').fill(copy.Pinouts.Modules['ky-040'].name);
    await expect(page.locator('aside button[value]')).toHaveCount(1);
    await expect(page.locator('aside button[value="ky-040"]')).toHaveText(copy.Pinouts.Modules['ky-040'].name + '1');
    await page.setViewportSize({ width: 320, height: 844 });
    for (const [id, module] of Object.entries(copy.Pinouts.Modules)) {
      await page.getByRole('combobox', { name: copy.Pinouts.title, exact: true }).selectOption(id);
      await expect(detail.getByRole('heading', { level: 2 })).toHaveText(module.name);
      expect(await page.evaluate(inspectMobileLayout), `${locale}/${id} at 320px`).toEqual([]);
    }
    expect(errors).toEqual([]);
  });
}
