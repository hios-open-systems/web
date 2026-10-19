import { expect, test, type Locator } from '@playwright/test';
import en from '../messages/en.json';
import es from '../messages/es.json';
import de from '../messages/de.json';
import it from '../messages/it.json';

async function choose(select: Locator, option: string) {
  await select.press('ArrowDown');
  await select.page().locator('.ant-select-dropdown:visible').getByTitle(option, { exact: true }).click();
}

for (const [locale, copy] of Object.entries({ en, es, de, it })) {
  test(`${locale}: E24 crosses decades and ADC respects the requested voltage including tolerances`, async ({ page }) => {
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto(`/${locale}/calculators?tab=rc&targetFc=160&rcC=100`);
    await expect(page.getByText(/E24: 10.00 kΩ/)).toBeVisible();
    await page.goto(`/${locale}/calculators?tab=adc&vinMax=12&vadcMax=3.2&rBottomK=10&adcTolerancePct=0`);
    const output = page.locator('[data-divider-readout]');
    await expect(output).toContainText('3.000 V');
    await expect(page.locator('svg').filter({ hasText: '30.00 kΩ' })).toHaveCount(1);
    await page.getByRole('spinbutton', { name: copy.Electronics.tolerance, exact: true }).fill('5');
    await expect(output).toContainText('2.791 V');
    await expect(output).toContainText('3.011 V');
    await expect(page.locator('svg').filter({ hasText: '33.00 kΩ' })).toHaveCount(1);
    await expect(page).not.toHaveURL(/adcTolerancePct=0/);
    await page.reload();
    await expect(output).toContainText('2.791 V');
    await page.getByRole('button', { name: copy.Calculators.copy_summary, exact: true }).click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain('33.00 kΩ (E24)');
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain('2.791 V');
    await page.getByRole('spinbutton', { name: copy.Calculators.cards.adc.vin, exact: true }).fill('0');
    await expect(output.getByRole('status')).toHaveText(copy.Electronics.invalid);
    await page.goto(`/${locale}/calculators?tab=led&supply=5&ledVf=2&ledCurrent=12`);
    await expect(page.locator('svg').filter({ hasText: '270.00 Ω' })).toHaveCount(1);
    await expect(page.locator('[data-led-commercial]')).toContainText('11.111 mA');
    await page.getByRole('button', { name: copy.Calculators.copy_summary, exact: true }).click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain('270.00 Ω (E24)');
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain('33.3 mW');
  });

  test(`${locale}: MAX98357 uses actual supply, parallel pullups and threshold uncertainty`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => { if (/MISSING_MESSAGE|INVALID_MESSAGE/.test(message.text())) errors.push(message.text()); });
    await page.goto(`/${locale}/pinouts#max98357a`);
    const lab = page.locator('[data-max98357-lab]');
    const channel = lab.locator('[data-sd-channel]');
    const readout = lab.locator('[data-divider-readout]');
    const input = (name: string) => lab.getByRole('spinbutton', { name, exact: true });
    await expect(readout).toContainText('1.087 V');
    await expect(channel).toContainText(copy.Electronics.max.stable);
    if (locale === 'en') await lab.screenshot({ path: test.info().outputPath('max98357-desktop.png') });
    await input(copy.Electronics.max.external).fill('220');
    await expect(readout).toContainText('1.563 V');
    await expect(channel).toContainText(copy.Electronics.max.left);
    await expect(channel).toContainText(copy.Electronics.max.uncertain);
    await lab.getByRole('button', { name: `${copy.Electronics.max.recommend}: 360 kΩ`, exact: true }).click();
    await input(copy.Electronics.tolerance).fill('10');
    await expect(channel).toContainText(copy.Electronics.max.uncertain);
    await lab.getByRole('button', { name: `${copy.Electronics.max.recommend}: 390 kΩ`, exact: true }).click();
    await expect(channel).toContainText(copy.Electronics.max.stable);
    await input(copy.Electronics.tolerance).fill('5');
    await lab.getByRole('button', { name: `${copy.Electronics.max.recommend}: 360 kΩ`, exact: true }).click();
    await input(copy.Electronics.max.onboard).fill('1000');
    await expect(channel).toContainText(copy.Electronics.max.uncertain);
    await lab.getByRole('button', { name: `${copy.Electronics.max.recommend}: 560 kΩ`, exact: true }).click();
    await expect(channel).toContainText(copy.Electronics.max.stable);
    const connection = lab.getByRole('combobox', { name: copy.Electronics.max.connection, exact: true });
    await choose(connection, copy.Electronics.max.open);
    await expect(channel).toContainText(copy.Electronics.max.mono);
    await input(copy.Electronics.max.onboard).fill('0');
    await expect(channel).toContainText(copy.Electronics.max.off);
    await choose(connection, copy.Electronics.max.direct);
    await expect(channel).toContainText(copy.Electronics.max.left);
    await input(copy.Electronics.max.supply).fill('3.3');
    await lab.getByRole('button', { name: `${copy.Electronics.max.recommend}: 220 kΩ`, exact: true }).click();
    await expect(readout).toContainText('1.031 V');
    await expect(channel).toContainText(copy.Electronics.max.stable);
    await input(copy.Electronics.max.supply).fill('');
    await expect(readout.getByRole('status')).toHaveText(copy.Electronics.invalid);
    await expect(channel).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test(`${locale}: PAD and Speaker render the same translated SD example and calculator`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => { if (/MISSING_MESSAGE|INVALID_MESSAGE/.test(message.text())) errors.push(message.text()); });
    for (const guide of ['pad', 'speaker']) {
      await page.goto(`/${locale}/pinouts/${guide}`);
      await page.getByRole('tab', { name: copy.WiringGuide.tabs.parlantes, exact: true }).click();
      const panel = page.getByRole('tabpanel');
      await expect(panel).toContainText(copy.Electronics.max.intro);
      await expect(panel.locator('svg[role="img"]').last()).toContainText('360 kΩ');
      await expect(panel.locator('svg[role="img"]').last()).not.toContainText('220–330');
      await expect(panel.locator('[data-divider-readout]')).toContainText('1.087 V');
      await expect(panel.locator('ol li')).toHaveCount(6);
      await expect(panel.locator('ol')).toContainText('0.825–1.245 V');
      await expect(panel.locator('ol')).not.toContainText('Electronics.');
    }
    expect(errors).toEqual([]);
  });
}

test('ADC tolerance survives saved presets and nondefault shared links', async ({ page }) => {
  await page.goto('/en/calculators?tab=adc&vinMax=12&vadcMax=3.2&adcTolerancePct=0');
  await expect(page.locator('[data-divider-readout]')).toContainText('3.000 V');
  await page.getByRole('button', { name: en.Presets.save, exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: en.Presets.save, exact: true }).click();
  await page.getByRole('spinbutton', { name: en.Electronics.tolerance, exact: true }).fill('10');
  await expect(page).toHaveURL(/adcTolerancePct=10/);
  await page.reload();
  await expect(page.getByRole('spinbutton', { name: en.Electronics.tolerance, exact: true })).toHaveAttribute('aria-valuenow', '10');
  await page.getByRole('button', { name: `${en.Presets.presets} (1)`, exact: true }).click();
  await page.getByRole('menuitem', { name: new RegExp(en.Presets.defaultName.replace('{n}', '1')) }).click();
  await expect(page.locator('[data-divider-readout]')).toContainText('3.000 V');
  await expect(page).toHaveURL(/adcTolerancePct=0/);
});
