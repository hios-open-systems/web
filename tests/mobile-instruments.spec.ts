import { expect, test } from '@playwright/test';
import { inspectMobileLayout } from './helpers/mobile-layout';
import en from '../messages/en.json';
import es from '../messages/es.json';
import de from '../messages/de.json';
import it from '../messages/it.json';

for (const [locale, copy] of Object.entries({ en, es, de, it })) {
  test(`${locale}: calculator and pinout instruments fit narrow screens and support keyboard controls`, async ({ page }, testInfo) => {
    if (testInfo.project.name === 'mobile-360') await page.setViewportSize({ width: 320, height: 844 });
    for (const kind of ['rc', 'rl', 'rcl', 'gain']) {
      await page.goto(`/${locale}/calculators?tab=${kind}`);
      const lab = page.locator(`[data-sine-lab="${kind}"]`);
      if (kind === 'gain') {
        await expect(lab.getByRole('img', { name: copy.Instrument.gain.description })).toBeVisible();
        await page.getByRole('spinbutton', { name: copy.Calculators.cards.gain.rf, exact: true }).fill('20000');
        await expect(lab.locator('[data-sine-readouts]')).toContainText('Av = 21.000');
      } else {
        const action = kind === 'rcl' ? copy.Instrument.excitation.atResonance : copy.Instrument.excitation.atCutoff;
        await lab.getByRole('button', { name: action, exact: true }).click();
      }
      await expect(lab.locator('[data-sine-readouts]')).toContainText(['rcl', 'gain'].includes(kind) ? 'φ = 0.0°' : '-45.0°');
      await expect(lab.locator('[data-trace-id]')).toHaveCount(2);
      expect(await page.evaluate(inspectMobileLayout)).toEqual([]);
    }

    await page.goto(`/${locale}/calculators?tab=i2s&sampleRate=48000&bitDepth=24&i2sSlotBits=32`);
    const i2s = page.locator('[data-i2s-scope]');
    await expect(i2s.locator('[data-i2s-readouts]')).toContainText('3.072MHz');
    await page.getByRole('spinbutton', { name: copy.Calculators.cards.i2s.channels, exact: true }).fill('1');
    await expect(i2s.locator('[data-i2s-readouts]')).toContainText('3.072MHz');
    expect(await page.evaluate(inspectMobileLayout)).toEqual([]);

    await page.goto(`/${locale}/pinouts#pcm5102`);
    const lab = page.locator('[data-pinout-signal-lab]');
    await lab.getByRole('button', { name: copy.Instrument.pause, exact: true }).click();
    const sampleRate = lab.getByRole('combobox', { name: copy.Instrument.i2s.sampleRate, exact: true });
    await sampleRate.press('ArrowDown');
    await expect(sampleRate).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByRole('option', { name: '48kHz', exact: true })).toHaveAttribute('aria-selected', 'true');
    await expect(sampleRate).toHaveAttribute('aria-activedescendant', /_list_1$/);
    await sampleRate.press('ArrowDown');
    await expect(sampleRate).toHaveAttribute('aria-activedescendant', /_list_2$/);
    await sampleRate.press('Enter');
    await expect(lab.locator('[data-i2s-readouts]')).toContainText('BCK = 6.144MHz');
    await expect(lab.locator('[data-i2s-readouts]')).toContainText('LRCK = 96kHz');
    await expect(lab.getByRole('button', { name: copy.Instrument.resume, exact: true })).toBeVisible();
    for (const trace of await lab.locator('[data-trace-id]').all()) {
      const path = await trace.getAttribute('d');
      expect(path).toMatch(/^M/);
      expect(path).not.toMatch(/NaN|Infinity/);
    }
    expect(await page.evaluate(inspectMobileLayout)).toEqual([]);
  });
}
