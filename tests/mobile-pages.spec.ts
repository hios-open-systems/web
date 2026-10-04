import { expect, test } from '@playwright/test';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { inspectMobileLayout } from './helpers/mobile-layout';

const root = '.next/server/app';
function htmlFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = join(directory, entry.name);
    return entry.isDirectory() ? htmlFiles(file) : entry.name.endsWith('.html') ? [file] : [];
  });
}
const routes = htmlFiles(root)
  .map((file) => '/' + relative(root, file).replaceAll('\\', '/').replace(/\.html$/, ''))
  .filter((route) => (route === '/es' || route.startsWith('/es/')) && route !== '/es/admin')
  .filter((route) => {
    try { return !(JSON.parse(readFileSync(join(root, route.slice(1) + '.meta'), 'utf8')).status >= 300); }
    catch { return true; }
  });
if (!routes.length) throw new Error('Build the application before checking all public routes.');

for (const route of routes) {
  test(`${route} fits the mobile viewport`, async ({ page }, testInfo) => {
    const width = testInfo.project.name === 'mobile-360' ? 320 : page.viewportSize()!.width;
    await page.setViewportSize({ width, height: 844 });
    const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBeLessThan(400);
    if (await page.locator('[data-tool-content]').count()) {
      await expect(page.locator('[data-tool-content] > *').first()).toBeAttached();
      await expect(page.locator('[data-tool-content] .ant-result-error')).toHaveCount(0);
    }
    await page.waitForTimeout(900);
    expect(await page.evaluate(inspectMobileLayout)).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth))
      .toBeLessThanOrEqual(width + 1);
  });
}
