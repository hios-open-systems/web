import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const BASE = process.env.SHOTS_BASE || 'http://localhost:3000';
const OUT = process.env.SHOTS_OUT || './shots';
const ROUTES = (process.env.SHOTS_ROUTES || '/es,/es/calculators,/es/pinouts,/es/composer,/es/workbench/audio-convert,/es/workbench/image-convert,/es/tools').split(',');
const SIZES = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
];

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
for (const size of SIZES) {
  const ctx = await browser.newContext({ viewport: { width: size.width, height: size.height } });
  const page = await ctx.newPage();
  for (const route of ROUTES) {
    try {
      await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 60000 });
      await page.waitForTimeout(1500);
      const slug = route.replace(/[^a-z0-9]+/gi, '_') || 'home';
      await page.screenshot({ path: `${OUT}/${size.name}_${slug}.png`, fullPage: true });
      console.log('shot', size.name, route);
    } catch (err) {
      console.error('fail', size.name, route, String(err).slice(0, 120));
    }
  }
  await ctx.close();
}
await browser.close();
console.log('shots ->', OUT);
