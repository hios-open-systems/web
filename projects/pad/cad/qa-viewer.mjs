// Usage: node projects/pad/cad/qa-viewer.mjs ABSOLUTE_PREVIEW.html OUTPUT_DIRECTORY
// The preview is the skill's standalone wrapper around generated/preview.html.
import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const [preview, output] = process.argv.slice(2);
assert(preview && output, 'Pass preview HTML and screenshot output directory.');
const study = JSON.parse(await readFile(new URL('./generated/study.json', import.meta.url), 'utf8'));
for (const scene of study.scenes) {
  const data = await readFile(new URL(`./generated/${scene.id}.glb`, import.meta.url));
  const buffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
  const gltf = await new GLTFLoader().parseAsync(buffer, '');
  let count = 0;
  gltf.scene.traverse(node => { if (node.isMesh) count += 1; });
  assert.equal(count, scene.parts.filter(p => !p.reserve).length);
}

await mkdir(output, { recursive: true });
// The general-purpose preview wrapper adds unused tooltip/icon CDN scripts.
// Remove those from the QA copy; this study itself uses only embedded code/data.
const wrapper = (await readFile(preview, 'utf8')).replace(
  /&lt;script (?:(?!&gt;).)*src=&quot;https:\/\/[^&]+&quot;&gt;&lt;\/script&gt;/g, '');
const offlinePreview = path.join(output, 'pad-preview-offline.html');
await writeFile(offlinePreview, wrapper);
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 880, height: 1000 } });
const errors = [], external = [];
page.on('pageerror', error => errors.push(error.message));
await page.route(/^https?:/, route => { external.push(route.request().url()); return route.abort(); });
try {
  await page.goto(pathToFileURL(offlinePreview).href);
  const frame = page.frameLocator('iframe');
  await frame.locator('#pad-overall').waitFor();
  assert.equal(await frame.locator('#pad-legend').isVisible(), false);
  for (const [index, scene] of study.scenes.entries()) {
    await frame.locator(`[data-layout="${index}"]`).click();
    assert.match(await frame.locator('#pad-base').innerText(), new RegExp(scene.base.join(' × ')));
    for (const angle of [0, 35, 55, 75]) {
      await frame.locator('#pad-angle').fill(String(angle));
      assert.equal(await frame.locator('#pad-angle-value').innerText(), `${angle}°`);
      const expected = study.reports[scene.id].metrics.find(item => item.angle === angle);
      assert.ok((await frame.locator('#pad-overall').innerText()).includes(
        expected.overall_mm.map(v => v.toFixed(1)).join(' × ')));
    }
  }
  await frame.locator('[data-layout="1"]').click();
  for (const view of ['iso', 'top', 'side']) {
    await frame.locator('#pad-view').selectOption(view);
    await page.screenshot({ path: path.join(output, `pad-${view}.png`) });
  }
  await frame.locator('#pad-view').selectOption('top');
  await frame.locator('#pad-inside').check();
  assert.equal(await frame.locator('#pad-legend').isVisible(), true);
  await frame.locator('#pad-part').selectOption('battery');
  assert.match(await frame.locator('#pad-detail').innerText(), /80 × 42 × 21/);
  await frame.locator('#pad-clearance').check();
  assert.ok(await frame.locator('[data-part="usb-space"]').count() > 0);
  await page.screenshot({ path: path.join(output, 'pad-interior.png') });
  await frame.locator('#pad-clearance').uncheck();
  await frame.locator('#pad-inside').uncheck();
  await frame.locator('#pad-view').selectOption('iso');
  await frame.locator('#pad-part').selectOption('display');
  for (const width of [360, 320]) {
    await page.setViewportSize({ width, height: 1100 });
    const fits = await frame.locator('#pad-packaging-study').evaluate(root =>
      root.scrollWidth <= root.clientWidth + 1);
    assert.ok(fits, `Horizontal overflow at ${width}px`);
    await page.screenshot({ path: path.join(output, `pad-${width}.png`) });
  }
  assert.deepEqual(errors, []);
  assert.deepEqual(external, []);
  console.log('PASS: 3 GLB imports, 12 angle states, 3 views, component/clearance controls, 320/360px, no external requests.');
} finally {
  await browser.close();
}
