import { test, expect } from '@playwright/test';
import { guideMessages, type GuideLocale } from './helpers/wiring-guides';

for (const locale of ['es', 'en', 'de', 'it'] as GuideLocale[]) {
  for (const project of ['pad', 'btdac']) {
    test(`${locale}/${project}: wiring selection and persistent assembly`, async ({ page }) => {
      const copy = guideMessages[locale];
      const errors: string[] = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(`/${locale}/pinouts/${project}`);
      await page.getByRole('tab', { name: copy.WiringGuide.tabs.workbench, exact: true }).click();
      const bench = page.locator('[data-wiring-workbench]');
      await bench.getByLabel(copy.Assembly.chooseModule).selectOption('1');
      const connection = bench.locator('[data-connection]').last();
      const name = await connection.getAttribute('aria-label');
      await connection.focus();
      await page.keyboard.press('Enter');
      await expect(connection).toHaveAttribute('aria-pressed', 'true');
      await expect(bench.locator('[data-connection-detail]')).toContainText(name!.split(' · ')[0]);
      await bench.getByRole('radiogroup').getByText(copy.Assembly.assembly, { exact: true }).click();
      await bench.getByRole('checkbox').first().check();
      await page.reload();
      await page.getByRole('tab', { name: copy.WiringGuide.tabs.workbench, exact: true }).click();
      await bench.getByLabel(copy.Assembly.chooseModule).selectOption('1');
      await bench.getByRole('radiogroup').getByText(copy.Assembly.assembly, { exact: true }).click();
      await expect(bench.getByRole('checkbox').first()).toBeChecked();
      await bench.getByLabel(copy.Assembly.chooseModule).selectOption('0');
      await expect(bench.getByRole('checkbox').first()).not.toBeChecked();
      const nextLocale = locale === 'en' ? 'de' : 'en';
      const nextCopy = guideMessages[nextLocale];
      await page.goto(`/${nextLocale}/pinouts/${project}`);
      await page.getByRole('tab', { name: nextCopy.WiringGuide.tabs.workbench, exact: true }).click();
      await bench.getByLabel(nextCopy.Assembly.chooseModule).selectOption('1');
      await bench.getByRole('radiogroup').getByText(nextCopy.Assembly.assembly, { exact: true }).click();
      await expect(bench.getByRole('checkbox').first()).toBeChecked();
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

test('blocked storage reports unsaved progress without losing the current view', async ({ page }) => {
  await page.addInitScript(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key: string, value: string) {
      if (key.startsWith('hios:assembly:')) throw new Error('Storage unavailable');
      original.call(this, key, value);
    };
  });
  await page.goto('/en/pinouts/btdac');
  await page.getByRole('tab', { name: guideMessages.en.WiringGuide.tabs.workbench, exact: true }).click();
  const bench = page.locator('[data-wiring-workbench]');
  await bench.getByRole('radiogroup').getByText('Assembly', { exact: true }).click();
  await bench.getByRole('checkbox').first().check();
  await expect(bench.getByRole('alert')).toHaveText(guideMessages.en.Assembly.saveFailed);
  await expect(bench.getByRole('checkbox').first()).toBeChecked();
});
