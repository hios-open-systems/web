import { expect, test, type Page } from '@playwright/test';

async function expectReadableMath(page: Page) {
  const lines = page.locator('code[data-math-line]');
  await expect(lines.first()).toBeVisible();
  const measurements = await lines.evaluateAll(elements => elements.map(element => {
    const range = document.createRange();
    range.selectNodeContents(element);
    const box = element.getBoundingClientRect();
    return {
      text: element.textContent ?? '',
      lineTops: [...new Set([...range.getClientRects()].filter(rect => rect.height > 0).map(rect => Math.round(rect.top)))],
      left: box.left, right: box.right,
      overflow: element.scrollWidth > element.clientWidth + 1,
      tabIndex: element.getAttribute('tabindex'),
    };
  }));
  const viewportWidth = page.viewportSize()!.width;
  for (const line of measurements) {
    expect(line.lineTops, line.text).toHaveLength(1);
    expect(line.left, line.text).toBeGreaterThanOrEqual(-1);
    expect(line.right, line.text).toBeLessThanOrEqual(viewportWidth + 1);
    expect(line.text).not.toMatch(/\\(?:frac|sqrt|cdot|begin)|\uFFFD|\bNaN\b/);
    if (line.overflow) expect(line.tabIndex, line.text).toBe('0');
  }
  const overflowIndex = measurements.findIndex(line => line.overflow);
  if (overflowIndex >= 0) {
    const line = lines.nth(overflowIndex);
    await line.focus();
    await line.press('ArrowRight');
    await expect.poll(() => line.evaluate(element => element.scrollLeft)).toBeGreaterThan(0);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
}

test.beforeEach(async ({ page }, testInfo) => {
  if (testInfo.project.name === 'mobile-360') await page.setViewportSize({ width: 320, height: 844 });
  await page.route('**/api/auth/me', route => route.fulfill({ json: { user: null } }));
});

test('recovered lessons preserve complete equations, indices and power exponents on mobile', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/es/radio/lecciones/power');
  await expect(page.locator('code[data-math-line]').filter({ hasText: 'I²' })).toContainText('P = V · I = I² · R = V² / R');
  await expectReadableMath(page);
  await page.goto('/es/radio/lecciones/parallel');
  await expect(page.locator('code[data-math-line]').filter({ hasText: '(100 × 200)' })).toContainText('Rₑq = (100 × 200) / (100 + 200) ≈ 66,67 Ω');
  await expectReadableMath(page);
  expect(errors).toEqual([]);
});

test('official chapters keep reactance denominators and independent formulas intact', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/es/radio/a-electricidad');
  await expect(page.locator('#reactancia code[data-math-line]')).toHaveText(['XL = 2π·f·L', 'XC = 1 / (2π·f·C)']);
  await expect(page.locator('#resonancia code[data-math-line]').filter({ hasText: 'f₀ = 1 /' })).toContainText('f₀ = 1 / (2π·√(L·C))');
  await expectReadableMath(page);
  await page.goto('/es/radio/c-antenas-propagacion');
  await expect(page.locator('code[data-math-line]').filter({ hasText: 'ROE = (1 +' })).toHaveText('ROE = (1 + |Γ|) / (1 − |Γ|)');
  await expectReadableMath(page);
  expect(errors).toEqual([]);
});

test('circuit calculations retain long steps and extreme resistor readings without page overflow', async ({ page }) => {
  await page.goto('/es/radio/lecciones/laboratory');
  await expect(page.locator('[data-app-ready="true"]')).toBeVisible();
  const lab = page.getByTestId('dc-circuit-lab');
  await lab.getByRole('slider', { name: 'Resistencia R2' }).press('End');
  await expect(lab.locator('dd').nth(0)).toHaveText('90,91 Ω');
  await expect(lab.locator('dd').nth(1)).toHaveText('132 mA');
  await expect(lab.locator('code[data-math-line]').filter({ hasText: '(100 × 1000)' })).toContainText('(100 + 1000)');
  await expectReadableMath(page);
  await lab.getByRole('slider', { name: 'Resistencia R1' }).press('Home');
  await lab.getByRole('slider', { name: 'Resistencia R2' }).press('Home');
  await expect(lab.locator('dd').nth(0)).toHaveText('5 Ω');
  await expect(lab.locator('dd').nth(1)).toHaveText('2400 mA');
  await expect(lab.locator('dd').nth(2)).toHaveText('28,8 W');
  await expectReadableMath(page);
});

test('the print guide keeps equations readable when opened from a phone', async ({ page }) => {
  await page.goto('/es/radio/imprimir');
  await expect(page.locator('#reactancia code[data-math-line]')).toHaveText(['XL = 2π·f·L', 'XC = 1 / (2π·f·C)']);
  await expectReadableMath(page);
});

test('small nonzero circuit powers remain visible and only an off source displays zero watts', async ({ page }) => {
  await page.goto('/es/radio/lecciones/laboratory');
  await expect(page.locator('[data-app-ready="true"]')).toBeVisible();
  const lab = page.getByTestId('dc-circuit-lab');
  await lab.getByText('Serie', { exact: true }).click();
  await lab.getByRole('slider', { name: 'Tensión de la fuente' }).press('Home');
  await lab.getByRole('slider', { name: 'Resistencia R1' }).press('End');
  await lab.getByRole('slider', { name: 'Resistencia R2' }).press('End');
  await expect(lab.locator('dd').nth(1)).toHaveText('0,5 mA');
  await expect(lab.locator('dd').nth(2)).toHaveText('0,0005 W');
  await expect(lab.locator('tbody tr td:last-child')).toHaveText(['0,00025 W', '0,00025 W']);
  await expectReadableMath(page);
  await lab.getByRole('switch', { name: 'Fuente encendida' }).click();
  await expect(lab.locator('dd').nth(1)).toHaveText('0 mA');
  await expect(lab.locator('dd').nth(2)).toHaveText('0 W');
  await expect(lab.locator('tbody tr td:last-child')).toHaveText(['0 W', '0 W']);
});
