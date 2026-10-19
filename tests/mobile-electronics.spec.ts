import { expect, test } from '@playwright/test';
import { inspectMobileLayout } from './helpers/mobile-layout';
import en from '../messages/en.json';
import es from '../messages/es.json';
import de from '../messages/de.json';
import it from '../messages/it.json';

for (const [locale, copy] of Object.entries({ en, es, de, it })) {
  test(`${locale}: divider results and SD controls fit narrow screens`, async ({ page }, testInfo) => {
    if (testInfo.project.name === 'mobile-360') await page.setViewportSize({ width: 320, height: 844 });
    await page.goto(`/${locale}/calculators?tab=adc&vinMax=12&vadcMax=3.2`);
    await expect(page.locator('[data-divider-readout]')).toContainText('2.791 V');
    expect(await page.evaluate(inspectMobileLayout)).toEqual([]);
    await page.goto(`/${locale}/pinouts#max98357a`);
    const lab = page.locator('[data-max98357-lab]');
    await lab.getByRole('spinbutton', { name: copy.Electronics.max.external, exact: true }).fill('220');
    await expect(lab.locator('[data-sd-channel]')).toContainText(copy.Electronics.max.uncertain);
    if (locale === 'en') await lab.screenshot({ path: testInfo.outputPath('max98357-mobile.png') });
    expect(await page.evaluate(inspectMobileLayout)).toEqual([]);
    await page.goto(`/${locale}/pinouts/pad`);
    await page.getByRole('tab', { name: copy.WiringGuide.tabs.parlantes, exact: true }).click();
    await expect(lab.locator('[data-divider-readout]')).toContainText('1.087 V');
    expect(await page.evaluate(inspectMobileLayout)).toEqual([]);
  });
}
