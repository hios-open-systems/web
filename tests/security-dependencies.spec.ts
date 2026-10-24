import { test, expect } from '@playwright/test';

test('Excalidraw converts Mermaid with the patched ESM nanoid dependency', async ({ page }) => {
  await page.goto('/en/workbench/excalidraw');
  await expect(page.locator('.excalidraw canvas').first()).toBeVisible();
  await page.getByRole('button', { name: /More tools/ }).click();
  await page.getByText('Mermaid to Excalidraw', { exact: true }).click();
  await page.locator('textarea.ttd-dialog-input').fill('flowchart TD\n Start --> Finish');
  await expect(page.locator('.ttd-dialog-output-canvas-container canvas')).toBeVisible();
  await expect(page.getByTestId('ttd-dialog-output-error')).toHaveCount(0);
  await page.locator('textarea.ttd-dialog-input').press('Control+Enter');
  await expect(page.locator('textarea.ttd-dialog-input')).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => {
    const raw = localStorage.getItem('hios-excalidraw-scene');
    return raw ? JSON.parse(raw).elements?.length ?? 0 : 0;
  })).toBeGreaterThan(2);
});

test('patched Mermaid and KaTeX render math without executable HTML', async ({ page }) => {
  await page.goto('/en/workbench/mermaid');
  const editor = page.locator('main textarea');
  await editor.fill('flowchart LR\n A["$$x^2 + y^2$$"] --> B["Result"]');
  const preview = page.getByTestId('mermaid-preview');
  await expect(preview.locator('svg').first()).toBeVisible();
  await expect(preview.locator('.katex').first()).toBeAttached();
  await expect(page.getByRole('button', { name: /SVG/ })).toBeEnabled();
  await editor.fill('flowchart LR\n A["<script>window.__diagramExecuted = true</script>"] --> B["Safe"]');
  await expect(preview).toContainText('Safe');
  expect(await page.evaluate(() => Reflect.get(window, '__diagramExecuted'))).toBeUndefined();
  await expect(preview.locator('script')).toHaveCount(0);
});
