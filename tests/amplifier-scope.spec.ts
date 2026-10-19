import { expect, test, type Locator } from '@playwright/test';
import en from '../messages/en.json';

// Compare the rendered amplitudes and sample positions, not only the readout text.
async function expectTraceGain(lab: Locator, gain: number) {
  const points = async (id: string) => {
    const path = await lab.locator(`[data-trace-id="${id}"]`).getAttribute('d');
    expect(path).not.toMatch(/NaN|Infinity/);
    return [...path!.matchAll(/[ML]([\d.-]+),([\d.-]+)/g)].map((m) => [Number(m[1]), Number(m[2])]);
  };
  const input = await points('vin'), output = await points('vout');
  expect(input).toHaveLength(481); expect(output).toHaveLength(481);
  const middle = 108; // TimeScope: height 240, plot y = 24..192.
  for (let i = 0; i < input.length; i++) {
    expect(output[i][0]).toBe(input[i][0]);
    expect(Math.abs((middle - output[i][1]) - gain * (middle - input[i][1]))).toBeLessThan(0.01 * (gain + 1));
    expect(output[i][1]).toBeGreaterThanOrEqual(24);
    expect(output[i][1]).toBeLessThanOrEqual(192);
  }
}

test('Rf and Rg update the gain, diagram and correctly scaled in-phase signals while paused', async ({ page }) => {
  await page.goto('/en/calculators?tab=gain');
  const lab = page.locator('[data-sine-lab="gain"]'), readouts = lab.locator('[data-sine-readouts]');
  const schematic = page.getByRole('img', { name: en.Instrument.gain.schematic, exact: true });
  await expect(readouts).toContainText('Av = 11.000 (20.83 dB)');
  await expect(readouts).toContainText('Vout = 1.100 V');
  await expect(readouts).toContainText('φ = 0.0°');
  await lab.getByRole('button', { name: en.Instrument.pause }).click();
  await expectTraceGain(lab, 11);
  const frozen = await lab.locator('[data-trace-id="vout"]').getAttribute('d');
  await page.waitForTimeout(120);
  await expect(lab.locator('[data-trace-id="vout"]')).toHaveAttribute('d', frozen!);
  await page.getByRole('spinbutton', { name: en.Calculators.cards.gain.rf, exact: true }).fill('20000');
  await expect(readouts).toContainText('Av = 21.000 (26.44 dB)');
  await expect(readouts).toContainText('Vout = 2.100 V');
  await expect(schematic).toContainText('Rf: 20000 Ω');
  await expect(schematic).toContainText('21.00×');
  await expectTraceGain(lab, 21);
  await page.getByRole('spinbutton', { name: en.Calculators.cards.gain.rg, exact: true }).fill('2000');
  await expect(readouts).toContainText('Av = 11.000');
  await expectTraceGain(lab, 11);
  await page.getByRole('spinbutton', { name: en.Calculators.cards.gain.rf, exact: true }).fill('0');
  await expect(readouts).toContainText('Av = 1.000 (0.00 dB)');
  await expect(lab.locator('[data-trace-id="vout"]')).toHaveAttribute('d', (await lab.locator('[data-trace-id="vin"]').getAttribute('d'))!);
  await expect(lab.getByRole('button', { name: en.Instrument.resume })).toBeVisible();
});

test('frequency, amplitude and resistors survive saving and reload with reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/en/calculators?tab=gain&rf=9000&rg=3000');
  const lab = page.locator('[data-sine-lab="gain"]'), readouts = lab.locator('[data-sine-readouts]');
  await expect(lab.getByRole('button', { name: en.Instrument.resume })).toBeVisible();
  await lab.getByLabel(en.Instrument.excitation.frequency, { exact: true }).fill('2000');
  await lab.getByLabel(en.Instrument.excitation.amplitude, { exact: true }).fill('0.5');
  await expect(readouts).toContainText('Av = 4.000 (12.04 dB)');
  await expect(readouts).toContainText('Vout = 2.000 V');
  await expect(lab.getByRole('img', { name: en.Instrument.gain.description, exact: true })).toContainText('1.5m'); // Three cycles at 2 kHz = 1.5 ms.
  await expectTraceGain(lab, 4);
  await page.getByRole('button', { name: en.Presets.save, exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: en.Presets.save, exact: true }).click();
  await expect(page).toHaveURL(/gainInputHz=2000/);
  await expect(page).toHaveURL(/gainInputV=0.5/);
  await page.reload();
  await expect(readouts).toContainText('Vout = 2.000 V');
  await page.goto('/en/calculators?tab=gain');
  await page.getByRole('button', { name: en.Presets.presets, exact: true }).click();
  await page.getByRole('menuitem', { name: new RegExp(en.Presets.defaultName.replace('{n}', '1')) }).click();
  await expect(readouts).toContainText('Av = 4.000');
  await expect(lab.getByLabel(en.Instrument.excitation.frequency, { exact: true })).toHaveValue('2000');
  await expect(lab.getByLabel(en.Instrument.excitation.amplitude, { exact: true })).toHaveValue('0.5');
  await expectTraceGain(lab, 4);
});

for (const query of ['rg=0', 'rf=-1', 'rf=1e308&rg=1&gainInputV=100']) {
  test(`invalid amplifier values show no misleading signal and recover: ${query}`, async ({ page }) => {
    await page.goto(`/en/calculators?tab=gain&${query}`);
    const lab = page.locator('[data-sine-lab="gain"]');
    await expect(lab.getByRole('status')).toHaveText(en.Instrument.gain.invalid);
    await expect(lab.locator('[data-trace-id]')).toHaveCount(0);
    if (query === 'rg=0' || query === 'rf=-1') await expect(page.getByText(en.Calculators.cards.invalid, { exact: false })).toBeVisible();
    await page.getByRole('spinbutton', { name: en.Calculators.cards.gain.rf, exact: true }).fill('10000');
    await page.getByRole('spinbutton', { name: en.Calculators.cards.gain.rg, exact: true }).fill('1000');
    await expect(lab.locator('[data-trace-id]')).toHaveCount(2);
    await lab.getByLabel(en.Instrument.excitation.amplitude, { exact: true }).fill('');
    await expect(lab.locator('[data-trace-id]')).toHaveCount(0);
    await lab.getByLabel(en.Instrument.excitation.amplitude, { exact: true }).fill('0.1');
    await expect(lab.locator('[data-trace-id]')).toHaveCount(2);
  });
}
