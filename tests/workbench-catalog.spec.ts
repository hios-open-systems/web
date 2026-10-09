import { test, expect } from '@playwright/test';
import { workbenchTools } from '../config/workbench';
import en from '../messages/en.json';

for (const tool of workbenchTools.filter(tool => !tool.external)) {
  test(`catalog tool ${tool.id} has a usable entry and renders`, async ({ page }) => {
    await page.route('**/api/auth/me', route => route.fulfill({ json: { user: null } }));
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`/en${tool.href}`);
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
    if (!['serial-monitor', 'snippets', 'chiptune'].includes(tool.id)) {
      await expect(page.getByRole('heading', { level: 1 }).first()).toHaveText(en.Workbench.packs[tool.id].title);
    }
    if (!['payload', 'serial-monitor', 'snippets', 'chiptune'].includes(tool.id)) {
      await expect.poll(() => page.locator('[data-tool-content] input, [data-tool-content] button, [data-tool-content] textarea, [data-tool-content] canvas').count()).toBeGreaterThan(0);
    }
    await expect(page.locator('main')).not.toHaveCount(0);
    expect(errors).toEqual([]);
  });
}
