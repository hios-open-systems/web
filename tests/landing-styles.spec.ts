import { test, expect } from '@playwright/test';

test('landing styles survive client navigation and a cached reload', async ({ page }, testInfo) => {
  const failures: string[] = [];
  page.on('response', response => {
    if (response.request().resourceType() === 'stylesheet' && !response.ok()) failures.push(response.url());
  });
  page.on('requestfailed', request => {
    if (request.resourceType() === 'stylesheet') failures.push(request.url());
  });
  await page.goto('/es/workbench/hash-digest');
  await page.locator('header a[href="/es"]').first().click();
  await expect(page).toHaveURL(/\/es$/);
  for (let visit = 0; visit < 2; visit++) {
    await page.getByRole('button', { name: 'Oscilador', exact: true }).click();
    await expect(page.locator('[class*="heroSection_grid"]')).toHaveCSS('display', 'grid');
    await expect(page.locator('[data-signal-wave] [class*="instrument_wave"]')).toHaveCSS('fill', 'none');
    expect(await page.locator('h1').evaluate(element => parseFloat(getComputedStyle(element).fontSize))).toBeGreaterThan(40);
    if (visit === 0) await page.reload();
  }
  expect(failures).toEqual([]);
  await page.screenshot({ path: testInfo.outputPath('landing-styles.png'), fullPage: false });
});
