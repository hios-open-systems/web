import { test, expect } from '@playwright/test';
for (const route of ['/en/workbench', '/en/workbench/spaces', '/en/workbench/payload', '/en/explore']) {
  test(`workspace layout ${route}`, async ({ page }, testInfo) => {
    await page.route('**/api/auth/me', route => route.fulfill({ json: { user: null } }));
    await page.goto(route);
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
    if (route.endsWith('payload')) await expect(page.getByRole('textbox', { name: 'Input' })).toBeEnabled();
    if (route.endsWith('explore')) await expect(page.getByRole('button', { name: 'Add to space' }).first()).toBeEnabled();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    expect(overflow).toBeLessThanOrEqual(2);
    await page.screenshot({ path: testInfo.outputPath('layout.png') });
  });
}
