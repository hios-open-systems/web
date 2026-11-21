import { expect, test, type Page } from '@playwright/test';
import es from '../messages/es.json';

async function changeTopic(page: Page, title: string) {
  const select = page.getByRole('combobox', { name: 'Cambiar de tema' });
  const option = page.locator(`.ant-select-dropdown:visible .ant-select-item-option[title="${title}"]`);
  await select.press('ArrowDown');
  for (let attempt = 0; attempt < 16 && !await option.isVisible(); attempt++) {
    await select.press('ArrowDown');
  }
  await option.click();
}

test('radio course pages fit narrow screens and remain operable', async ({ page }, testInfo) => {
  if (testInfo.project.name === 'mobile-360') await page.setViewportSize({ width: 320, height: 844 });
  await page.route('**/api/auth/me', (route) => route.fulfill({ json: { user: null } }));
  await page.goto('/es/radio');
  await expect(page.getByTestId('radio-course-home')).toBeVisible();
  await expect(page.getByTestId('dc-circuit-lab')).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Empezar por tensión', exact: true }).click();
  await expect(page).toHaveURL(/\/radio\/lecciones\/voltage$/);
  await expect(page.locator('#radio-page-title')).toHaveText('Tensión');
  await expect(page.locator('[data-radio-lesson] [data-concept]')).toHaveCount(1);
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await changeTopic(page, 'Laboratorio de circuitos');
  await expect(page).toHaveURL(/\/radio\/lecciones\/laboratory$/);
  const lab = page.getByTestId('dc-circuit-lab');
  await expect(lab).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await lab.getByText('Serie', { exact: true }).click();
  await expect(lab.locator('dd').nth(1)).toHaveText('40 mA');
  await lab.getByRole('switch', { name: 'R2 conectada' }).click();
  await expect(lab.locator('dd').nth(1)).toHaveText('0 mA');
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await changeTopic(page, 'Glosario de radioafición');
  await expect(page).toHaveURL(/\/radio\/lecciones\/glossary$/);
  await expect(lab).toHaveCount(0);
  const glossary = page.getByTestId('radio-glossary');
  await glossary.getByRole('textbox', { name: 'Buscar un término' }).fill('DMR');
  await expect(glossary.locator('[data-glossary-entry="dmr"]')).toContainText('12,5 kHz');
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await changeTopic(page, es.RadioCourse.pages.bands.title);
  await expect(page).toHaveURL(/\/radio\/lecciones\/bands$/);
  const spectrum = page.getByTestId('radio-band-spectrum');
  await spectrum.getByRole('button', { name: /^UHF\b/ }).click();
  const bandDetail = page.getByTestId('radio-band-detail');
  await expect(bandDetail.locator('[lang="en"]')).toHaveText('Ultra High Frequency');
  await expect(bandDetail.locator('dd').first()).toHaveText(/300 MHz\s*–\s*3 GHz/);
  await expect(bandDetail).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  const amateurTable = page.getByTestId('amateur-band-table');
  await expect(amateurTable.locator('[data-amateur-band]')).toHaveCount(5);
  await expect(amateurTable.locator('[data-amateur-band="eighty"]')).toContainText(/3,5 MHz\s*–\s*4 MHz/);
  await amateurTable.getByRole('button', { name: '70 cm', exact: true }).click();
  const amateurDetail = page.getByTestId('amateur-band-detail');
  await expect(amateurDetail.getByRole('heading', { name: '70 cm', exact: true })).toBeVisible();
  await expect(amateurDetail).toContainText('DMR');
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('new signal lessons fit the mobile reading column', async ({ page }) => {
  await page.goto('/es/radio');
  await page.getByTestId('radio-lesson-list').getByRole('link', { name: /Ondas y frecuencia/ }).click();
  for (const topic of ['waves', 'propagation', 'morse'] as const) {
    await expect(page.locator('#radio-page-title')).toHaveText(es.RadioCourse.pages[topic].title);
    await expect(page.locator('[data-radio-lesson] figure')).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    if (topic !== 'morse') await page.locator('[data-direction="next"]').click();
  }
});
