import { chromium } from '@playwright/test';
import { readFile, mkdir } from 'node:fs/promises';
import { demoConfig, demoFrame } from './pad-demo-fixture.mjs';

// Render the original companion pages with a mocked transport. No PAD required.
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1100, height: 800 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(({ config, frame }) => {
    window.fetch = async () => new Response(JSON.stringify({ os: 'win', edit: config }), { status: 200 });
    window.EventSource = class {
      constructor() {
        setTimeout(() => {
          this.onopen?.();
          this.onmessage?.({ data: JSON.stringify(frame) });
        }, 50);
      }
      close() {}
    };
  }, { config: demoConfig, frame: demoFrame });
  for (const [file, target, height] of [
    ['index.html', 'companion-mirror-demo.png', 720],
    ['admin.html', 'companion-editor-demo.png', 800],
  ]) {
    const html = await readFile(`projects/pad/companion/src/web/public/${file}`, 'utf8');
    await page.route(`http://pad-capture.local/${file}`, route => route.fulfill({ contentType: 'text/html', body: html }));
    await page.setViewportSize({ width: 1100, height });
    await page.goto(`http://pad-capture.local/${file}`);
    await page.locator(file === 'index.html' ? '#lname' : '#view-shortcuts .bind').first().waitFor({ state: 'visible' });
    if (file === 'index.html') {
      await page.locator('#lname').filter({ hasText: 'Edicion' }).waitFor();
      await page.locator('#conn').evaluate(el => { el.textContent = 'Vista de ejemplo · datos simulados · sin PAD conectado'; });
    } else {
      await page.locator('#status').evaluate(el => { el.textContent = 'Configuración de ejemplo · sin PAD conectado'; });
    }
    await mkdir('public/images/pad', { recursive: true });
    await page.screenshot({ path: `public/images/pad/${target}` });
  }
  if (errors.length) throw new Error(errors.join('\n'));
  console.log('Captured actual companion mirror and editor with sample data.');
} finally {
  await browser.close();
}
