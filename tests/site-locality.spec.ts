import { expect, test } from '@playwright/test';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = '.next/server/app';
function htmlFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const file = join(directory, entry.name);
    return entry.isDirectory() ? htmlFiles(file) : entry.name.endsWith('.html') ? [file] : [];
  });
}
const routes = htmlFiles(root).map(file => '/' + relative(root, file).replaceAll('\\', '/').replace(/\.html$/, ''))
  .filter(route => /^\/(es|en|de|it)(\/|$)/.test(route) && !/\/admin(\/|$)/.test(route))
  .filter(route => {
    try { return !(JSON.parse(readFileSync(join(root, route.slice(1) + '.meta'), 'utf8')).status >= 300); }
    catch { return true; }
  });
if (!routes.length) throw new Error('Build the site before auditing network locality.');

for (const route of routes) {
  test(`${route} has no implicit outbound traffic`, async ({ page, baseURL }) => {
    const unexpected: string[] = [];
    const origin = new URL(baseURL!).origin;
    page.on('request', request => {
      const url = new URL(request.url());
      if (['http:', 'https:', 'ws:', 'wss:'].includes(url.protocol) && url.origin !== origin) unexpected.push(request.url());
      if (/^\/api\/(workbench\/(dns|rdap|certificate)|usage\/events)/.test(url.pathname)) unexpected.push(request.url());
    });
    // Never send unexpected requests while auditing production.
    await page.route('**/*', request => {
      const url = new URL(request.request().url());
      return url.origin !== origin || /^\/api\/(workbench\/(dns|rdap|certificate)|usage\/events)/.test(url.pathname)
        ? request.abort() : request.continue();
    });
    const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBeLessThan(400);
    if (await page.locator('[data-tool-content]').count()) {
      await expect(page.locator('[data-tool-content] > *').first()).toBeAttached();
      await expect(page.locator('[data-tool-content] .ant-result-error')).toHaveCount(0);
    }
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const example = page.getByRole('button', { name: /^(?:.* )?(?:Load example|Cargar ejemplo|Ejemplo|Beispiel laden|Esempio|Carica esempio)$/i }).first();
    if (await example.isVisible() && await example.isEnabled()) await example.click();
    await page.waitForTimeout(1000); // Observe lazy resources, hydration and debounced renders.
    expect([...new Set(unexpected)]).toEqual([]);
  });
}
