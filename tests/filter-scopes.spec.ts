import { expect, test } from '@playwright/test';
import en from '../messages/en.json';

test('RL cutoff, R/L changes, amplitude and URL all update the paused scope', async ({ page }) => {
  await page.goto('/en/calculators?tab=rl');
  const lab = page.locator('[data-filter-lab="rl"]');
  const readouts = lab.locator('[data-filter-readouts]');
  await lab.getByRole('button', { name: en.Instrument.excitation.atCutoff }).click();
  await expect(readouts).toContainText('0.707 (-3.01 dB)');
  await expect(readouts).toContainText('φ = -45.0°');
  await lab.getByRole('button', { name: en.Instrument.pause }).click();
  const output = lab.locator('[data-trace-id="vout"]');
  const frozen = await output.getAttribute('d');
  await page.waitForTimeout(120);
  await expect(output).toHaveAttribute('d', frozen!);
  await page.getByRole('spinbutton', { name: en.Calculators.cards.rl.r, exact: true }).fill('2000');
  await expect(readouts).toContainText('φ = -26.6°');
  await expect(output).not.toHaveAttribute('d', frozen!);
  await page.getByRole('spinbutton', { name: en.Calculators.cards.rl.l, exact: true }).fill('200');
  await expect(readouts).toContainText('φ = -45.0°');
  await lab.getByLabel(en.Instrument.excitation.amplitude, { exact: true }).fill('2');
  await expect(readouts).toContainText('Vout = 1.414 V');
  await lab.getByLabel(en.Instrument.excitation.frequency, { exact: true }).fill('500');
  await expect(readouts).toContainText('φ = -17.4°');
  await expect(lab.getByRole('button', { name: en.Instrument.resume })).toBeVisible();
  await expect(page).toHaveURL(/rlInputHz=500/);
  await expect(page).toHaveURL(/rlInputV=2/);
  await page.reload();
  await expect(readouts).toContainText('φ = -17.4°');
  await expect(lab.getByLabel(en.Instrument.excitation.amplitude, { exact: true })).toHaveAttribute('aria-valuenow', '2');
});

test('RCL uses the calculator frequency and shows resonance, lead and lag across R', async ({ page }) => {
  await page.goto('/en/calculators?tab=rcl');
  const lab = page.locator('[data-filter-lab="rcl"]');
  const readouts = lab.locator('[data-filter-readouts]');
  await expect(page.getByRole('img', { name: en.Instrument.rcl.schematic, exact: true })).toContainText('Vout = VR');
  await lab.getByRole('button', { name: en.Instrument.excitation.atResonance }).click();
  await expect(readouts).toContainText('1.000 (0.00 dB)');
  await expect(readouts).toContainText('φ = 0.0°');
  await lab.getByRole('button', { name: en.Instrument.pause }).click();
  const output = lab.locator('[data-trace-id="vout"]');
  await expect(output).toHaveAttribute('d', (await lab.locator('[data-trace-id="vin"]').getAttribute('d'))!);
  await page.getByRole('spinbutton', { name: en.CalculatorsRCL.freq_hz, exact: true }).fill('1000');
  await expect(readouts).toContainText('φ = 84.1°');
  const below = await output.getAttribute('d');
  await page.getByRole('spinbutton', { name: en.CalculatorsRCL.r_ohm, exact: true }).fill('20');
  await expect(output).not.toHaveAttribute('d', below!);
  await page.getByRole('spinbutton', { name: en.CalculatorsRCL.l_mh, exact: true }).fill('20');
  await expect(readouts).toContainText('φ = 59.2°');
  await page.getByRole('spinbutton', { name: en.CalculatorsRCL.c_uf, exact: true }).fill('2');
  await expect(readouts).toContainText('φ = -66.5°');
  await lab.getByRole('button', { name: en.Instrument.excitation.atResonance }).click();
  await expect(readouts).toContainText('φ = 0.0°');
  await lab.getByLabel(en.Instrument.excitation.amplitude, { exact: true }).fill('2');
  await expect(readouts).toContainText('Vout = 2.000 V');
  await expect(lab.getByRole('button', { name: en.Instrument.resume })).toBeVisible();
  await expect(page).toHaveURL(/rclInputV=2/);
  await page.reload();
  await expect(readouts).toContainText('Vout = 2.000 V');
});

for (const kind of ['rl', 'rcl'] as const) {
  test(`${kind}: invalid parameters hide traces and valid edits recover without a reload`, async ({ page }) => {
    await page.goto(`/en/calculators?tab=${kind}&${kind}R=0`);
    const lab = page.locator(`[data-filter-lab="${kind}"]`);
    await expect(lab.getByRole('status')).toHaveText(en.Instrument.invalid);
    await expect(lab.locator('[data-trace-id]')).toHaveCount(0);
    const label = kind === 'rl' ? en.Calculators.cards.rl.r : en.CalculatorsRCL.r_ohm;
    await page.getByRole('spinbutton', { name: label, exact: true }).fill('100');
    await expect(lab.locator('[data-trace-id]')).toHaveCount(2);
    await lab.getByLabel(en.Instrument.excitation.amplitude, { exact: true }).fill('');
    await expect(lab.locator('[data-trace-id]')).toHaveCount(0);
    await lab.getByLabel(en.Instrument.excitation.amplitude, { exact: true }).fill('1');
    await expect(lab.locator('[data-trace-id]')).toHaveCount(2);
  });

  test(`${kind}: saved configurations restore excitation and component values`, async ({ page }) => {
    const frequencyKey = kind === 'rl' ? 'rlInputHz' : 'rclF';
    await page.goto(`/en/calculators?tab=${kind}&${kind}R=100`);
    const frequencyLabel = kind === 'rl' ? en.Instrument.excitation.frequency : en.CalculatorsRCL.freq_hz;
    await page.getByRole('spinbutton', { name: frequencyLabel, exact: true }).fill('2000');
    await page.getByLabel(en.Instrument.excitation.amplitude, { exact: true }).fill('2.5');
    // Saving reads current inputs even if the router has not updated the address bar yet.
    await page.getByRole('button', { name: en.Presets.save, exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: en.Presets.save, exact: true }).click();
    await page.goto(`/en/calculators?tab=${kind}`);
    await page.getByRole('button', { name: en.Presets.presets, exact: true }).click();
    await page.getByRole('menuitem', { name: new RegExp(en.Presets.defaultName.replace('{n}', '1')) }).click();
    await expect(page).toHaveURL(new RegExp(`${frequencyKey}=2000`));
    await expect(page).toHaveURL(new RegExp(`${kind}InputV=2.5`));
    await expect(page.locator(`[data-filter-lab="${kind}"]`).getByLabel(en.Instrument.excitation.amplitude)).toHaveValue('2.5');
  });
}

test('reduced motion keeps filter traces still while values remain editable', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/en/calculators?tab=rcl');
  const lab = page.locator('[data-filter-lab="rcl"]');
  await expect(lab.getByRole('button', { name: en.Instrument.resume })).toBeVisible();
  const output = lab.locator('[data-trace-id="vout"]');
  const before = await output.getAttribute('d');
  await page.waitForTimeout(120);
  await expect(output).toHaveAttribute('d', before!);
  await page.getByRole('spinbutton', { name: en.CalculatorsRCL.freq_hz, exact: true }).fill('2000');
  await expect(output).not.toHaveAttribute('d', before!);
});
