import { test, expect } from '@playwright/test';
import { guideMessages, type GuideLocale } from './helpers/wiring-guides';

for (const locale of ['es', 'en', 'de', 'it'] as GuideLocale[]) {
  for (const project of ['pad', 'btdac']) {
    test(`${locale}/${project}: soldering mode keeps module and progress`, async ({ page }) => {
      const copy = guideMessages[locale];
      const errors: string[] = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(`/${locale}/pinouts/${project}`);
      const mode = page.locator('[data-soldering-mode]');
      await expect(mode).toBeVisible();
      await mode.getByRole('navigation', { name: copy.Assembly.modules }).getByRole('button').nth(1).click();
      const box = mode.locator('[data-wire] input[type=checkbox]').first();
      await box.check();
      await page.reload();
      await expect(mode.locator('[data-module]')).toHaveAttribute('data-module', project === 'pad' ? 'display' : 'dac');
      await expect(box).toBeChecked();
      const nextLocale = locale === 'en' ? 'de' : 'en';
      await page.goto(`/${nextLocale}/pinouts/${project}`);
      await expect(mode.locator('[data-wire] input[type=checkbox]').first()).toBeChecked();
      expect(errors).toEqual([]);
    });
  }
  test(`${locale}: physical pin selection preserves repeated ground positions`, async ({ page }) => {
    await page.goto(`/${locale}/pinouts#esp32-s3-devkitc-1`);
    await page.locator('[data-pin-picker]').selectOption('right-22');
    await expect(page.locator('[data-pin-inspector]')).toContainText('GND · J3-22');
    const pin = page.locator('[data-board-pin="J1-4 IO4"]');
    await pin.focus();
    await page.keyboard.press('Space');
    await expect(page.locator('[data-pin-picker]')).toHaveValue('left-4');
    await expect(page.locator('[data-pin-inspector]')).toContainText('ADC1_3');
  });
}

test('pad: header pin and wire list point at the same joint', async ({ page }) => {
  await page.goto('/en/pinouts/pad');
  const mode = page.locator('[data-soldering-mode]');
  await mode.getByRole('navigation', { name: guideMessages.en.Assembly.modules }).getByRole('button').nth(1).click();
  const pin = mode.locator('[data-header-pin="J1-16"]');
  await expect(pin).toContainText('IO10');
  await pin.click();
  await expect(pin).toHaveAttribute('aria-pressed', 'true');
  await expect(mode.locator('[data-wire][aria-current="true"]')).toContainText('J1·16');
});

test('blocked storage reports unsaved progress without losing the current view', async ({ page }) => {
  await page.addInitScript(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key: string, value: string) {
      if (key.startsWith('hios:solder:')) throw new Error('Storage unavailable');
      original.call(this, key, value);
    };
  });
  await page.goto('/en/pinouts/btdac');
  const mode = page.locator('[data-soldering-mode]');
  const box = mode.locator('[data-wire] input[type=checkbox]').first();
  await box.check();
  await expect(mode.getByRole('alert')).toHaveText(guideMessages.en.Assembly.saveFailed);
  await expect(box).toBeChecked();
});
