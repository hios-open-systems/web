import { test, expect } from '@playwright/test';
import { guideMessages, type GuideLocale } from './helpers/wiring-guides';

for (const locale of ['es', 'de'] as GuideLocale[]) {
  test(`${locale}: soldering mode fits mobile`, async ({ page }) => {
    const copy = guideMessages[locale];
    for (const path of [`/${locale}/pinouts/pad`, `/${locale}/projects/pad#soldering`]) {
      await page.goto(path);
      const mode = page.locator('[data-soldering-mode]');
      await mode.getByRole('navigation', { name: copy.Assembly.modules }).getByRole('button').nth(1).scrollIntoViewIfNeeded();
      await mode.getByRole('navigation', { name: copy.Assembly.modules }).getByRole('button').nth(1).click();
      await expect(mode.locator('[data-header-pin="J1-16"]')).toBeVisible();
      await mode.locator('[data-wire] input[type=checkbox]').last().check();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
  });
}
