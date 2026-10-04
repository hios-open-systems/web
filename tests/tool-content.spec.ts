import { expect, test } from '@playwright/test';

test('tool intro and guide exist without JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
  const page = await context.newPage();
  await page.goto('/en/workbench/hash-digest');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Hash generator');
  await expect(page.locator('main ol li').first()).toBeAttached();
  await context.close();
});

test('hydration keeps one heading, working actions and persistent guides', async ({ page }) => {
  await page.goto('/en/workbench/hash-digest');
  const heading = page.getByRole('heading', { level: 1 });
  await expect(heading).toHaveCount(1);
  await expect(heading).toHaveText('Hash generator');
  const toggle = page.getByRole('button', { name: /how to use/i });
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  const panel = page.locator(`[id="${await toggle.getAttribute('aria-controls')}"]`);
  await expect(panel).toBeHidden();
  await toggle.click();
  await expect(panel).toBeVisible();
  await page.reload();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(heading).toHaveCount(1);
  await expect(page.getByRole('button', { name: /clear|limpiar/i }).first()).toBeVisible();
  await page.locator('main textarea').fill('hello');
  await expect(page.getByText('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824')).toBeVisible();
  await page.getByRole('button', { name: 'Clear', exact: true }).click();
  await expect(page.locator('main textarea')).toHaveValue('');
});
