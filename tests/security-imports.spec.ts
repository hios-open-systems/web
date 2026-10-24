import { test, expect } from '@playwright/test';

test('imported drawing cannot load image URLs', async ({ page }) => {
  const requests: string[] = [];
  await page.route('**/api/version?imported-image', route => { requests.push(route.request().url()); return route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"/>' }); });
  await page.goto('/en/workbench/excalidraw');
  await expect(page.locator('.excalidraw canvas').first()).toBeVisible();
  await page.locator('.excalidraw').evaluate(host => {
    const scene = { type: 'excalidraw', version: 2, source: 'test', appState: {},
      elements: [{ id: 'image-test', type: 'image', x: 0, y: 0, width: 100, height: 100, angle: 0, strokeColor: '#000000', backgroundColor: 'transparent', fillStyle: 'solid', strokeWidth: 1, strokeStyle: 'solid', roughness: 0, opacity: 100, groupIds: [], frameId: null, roundness: null, seed: 1, version: 1, versionNonce: 1, isDeleted: false, boundElements: null, updated: 1, link: null, locked: false, fileId: 'image-file', status: 'saved', scale: [1, 1] }],
      files: { 'image-file': { id: 'image-file', mimeType: 'image/svg+xml', dataURL: location.origin + '/api/version?imported-image', created: 1 } } };
    const data = new DataTransfer();
    data.items.add(new File([JSON.stringify(scene)], 'attack.excalidraw', { type: 'application/json' }));
    host.dispatchEvent(new DragEvent('drop', { dataTransfer: data, bubbles: true, cancelable: true }));
  });
  await expect.poll(() => page.evaluate(() => localStorage.getItem('hios-excalidraw-scene') ?? '')).toContain('image-test');
  expect(requests).toEqual([]);
});

test('Mermaid blocks escaped CSS resource URLs', async ({ page }) => {
  const requests: string[] = [];
  await page.route('**/api/version?diagram-resource', route => { requests.push(route.request().url()); return route.abort(); });
  await page.goto('/en/workbench/mermaid');
  const css = "@font-face{font-family:Imported;src:u\\72l('/api/version?diagram-resource')} text{font-family:Imported!important}";
  await page.locator('main textarea').fill(`%%{init: ${JSON.stringify({ themeCSS: css })}}%%\nflowchart LR\n A[Security test] --> B[Done]`);
  await expect(page.getByText('Use local files or embedded images. This view does not load linked images or resources.')).toBeVisible();
  expect(requests).toEqual([]);
});

test('Markdown stored content remains inert after reload', async ({ page }) => {
  await page.goto('/en/workbench/notes');
  await page.locator('main textarea').fill('<script>window.__xss=1</script>\n<svg onload="window.__xss=1"></svg>\n[bad](javascript:window.__xss=1)\n# Harmless');
  await expect(page.getByTestId('notes-preview')).toContainText('Harmless');
  await page.reload();
  const preview = page.getByTestId('notes-preview');
  await expect(preview).toContainText('Harmless');
  await expect(preview.locator('script, svg, [onload], a[href^="javascript:"]')).toHaveCount(0);
  expect(await page.evaluate(() => Reflect.get(window, '__xss'))).toBeUndefined();
});

test('SVG uploads are displayed as inert images', async ({ page }) => {
  await page.goto('/en/workbench/image-base64');
  await page.locator('input[type=file]').setInputFiles({ name: 'untrusted.svg', mimeType: 'image/svg+xml', buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" onload="window.__xss=1"><script>window.__xss=1</script><rect width="40" height="40" fill="red"/></svg>') });
  await expect(page.getByRole('img', { name: 'untrusted.svg', exact: true })).toBeVisible();
  expect(await page.evaluate(() => Reflect.get(window, '__xss'))).toBeUndefined();
});

test('code sandbox cannot access parent DOM or browser storage', async ({ page }) => {
  await page.goto('/en/workbench/patterns');
  await page.locator('main textarea').fill("for (const [label, read] of [['PARENT', () => parent.document], ['STORAGE', () => localStorage.getItem('secret')], ['COOKIE', () => document.cookie]]) { try { read(); console.log(label + '_UNSAFE'); } catch { console.log(label + '_BLOCKED'); } }");
  await page.getByRole('button', { name: /Run/ }).click();
  const output = page.getByTestId('patterns-output');
  await expect(output).toContainText('PARENT_BLOCKED');
  await expect(output).toContainText('STORAGE_BLOCKED');
  await expect(output).toContainText('COOKIE_BLOCKED');
});
