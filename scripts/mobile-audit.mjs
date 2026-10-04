import { inspectMobileLayout } from '../tests/helpers/mobile-layout.ts';
import { chromium } from '@playwright/test';
import { readdirSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const base = process.env.MOBILE_BASE || 'http://127.0.0.1:3100';
const locale = process.env.MOBILE_LOCALE || 'es';
const width = Number(process.env.MOBILE_WIDTH || 360);
const root = '.next/server/app';
const output = `test-results/mobile-audit-${locale}-${width}`;
mkdirSync(output, { recursive: true });

function htmlFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? htmlFiles(path) : entry.name.endsWith('.html') ? [path] : [];
  });
}

const inventory = process.env.MOBILE_ROUTES_FILE
  ? JSON.parse(readFileSync(process.env.MOBILE_ROUTES_FILE, 'utf8')).map((entry) => entry.route.replace(/^\/(en|es|de|it)(?=\/|$)/, `/${locale}`))
  : htmlFiles(root).map((file) => '/' + relative(root, file).replaceAll('\\', '/').replace(/\.html$/, ''));
const routes = inventory
  .filter((route) => (route === `/${locale}` || route.startsWith(`/${locale}/`)) && !route.includes('/admin'))
  .filter((route) => {
    const metaPath = join(root, route.slice(1) + '.meta');
    try { return !(JSON.parse(readFileSync(metaPath, 'utf8')).status >= 300); } catch { return true; }
  });

if (!routes.length) throw new Error('No public routes found. Build the project before auditing.');
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || (process.platform === 'win32' ? 'msedge' : undefined) });
const context = await browser.newContext({ viewport: { width, height: 844 } });
const page = await context.newPage();
const results = [];
for (const route of routes) {
  try {
    const response = await page.goto(base + route, { waitUntil: 'domcontentloaded', timeout: 30000 });
    if (await page.locator('[data-tool-content]').count()) {
      await page.locator('[data-tool-content] > *').first().waitFor({ state: 'attached', timeout: 20000 });
    }
    await page.waitForTimeout(900);
    const issues = await page.evaluate(inspectMobileLayout);
    const toolFailed = await page.locator('[data-tool-content] .ant-result-error').count() > 0;
    const result = { route, status: response?.status(), issues, toolFailed };
    results.push(result);
    writeFileSync(`${output}/report.json`, JSON.stringify(results, null, 2));
    if (results.length % 10 === 0) console.log(`Progress: ${results.length}/${routes.length}`);
    if (issues.length || result.status >= 400 || toolFailed) {
      await page.screenshot({ path: `${output}/${route.replaceAll('/', '_')}.png`, fullPage: true });
      console.log(JSON.stringify(result));
    }
  } catch (error) { results.push({ route, error: String(error) }); console.log(route, String(error)); }
}
writeFileSync(`${output}/report.json`, JSON.stringify(results, null, 2));
const failures = results.filter((result) => result.issues?.length || result.error || result.status >= 400 || result.toolFailed);
console.log(`Audited ${results.length} routes at ${width}px; ${failures.length} need review.`);
await browser.close();
process.exitCode = failures.length ? 1 : 0;
