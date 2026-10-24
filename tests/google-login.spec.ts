import { test, expect } from '@playwright/test';

test('Google is explicit, preserves return URL and does not load a provider SDK', async ({ page }) => {
  const external: string[] = [];
  page.on('request', request => { if (/google|gstatic/.test(new URL(request.url()).hostname)) external.push(request.url()); });
  await page.route('**/api/auth/providers', route => route.fulfill({json:{google:true}}));
  await page.goto('/es/workbench?activity=audio');
  await page.locator('button[aria-controls="hios-user-panel"]').click();
  const google = page.getByRole('link',{name:'Continuar con Google',exact:true});
  await expect(google).toBeVisible();
  await expect(google).toHaveAttribute('href','/api/auth/google/start?next=%2Fes%2Fworkbench%3Factivity%3Daudio');
  expect(external).toEqual([]);
});
