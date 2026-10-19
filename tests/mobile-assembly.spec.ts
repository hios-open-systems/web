import { test, expect } from '@playwright/test';
import { guideMessages, type GuideLocale } from './helpers/wiring-guides';

for (const locale of ['es', 'de'] as GuideLocale[]) {
  test(`${locale}: wiring and soldering fit mobile`, async ({ page }) => {
    const copy = guideMessages[locale];
    await page.goto(`/${locale}/pinouts/btdac`);
    await page.getByRole('tab', { name: copy.WiringGuide.tabs.workbench, exact: true }).click();
    const bench = page.locator('[data-wiring-workbench]');
    await bench.getByLabel(copy.Assembly.chooseModule).selectOption('1');
    await bench.getByRole('button', { name: '#3 · GPIO13 · I2S DOUT', exact: true }).click();
    await expect(bench.locator('[data-connection-detail]')).toContainText('DIN');
    await bench.getByRole('radiogroup').getByText(copy.Assembly.assembly, { exact: true }).click();
    await bench.getByRole('checkbox').last().check();
    await expect(bench.getByRole('img')).toHaveCount(2);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
