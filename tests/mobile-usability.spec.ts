import { expect, test } from '@playwright/test';
import { inspectMobileLayout } from './helpers/mobile-layout';
import { CALC_IDS } from '../components/tools/calculators/registry';
import { readFileSync } from 'node:fs';

const copy = JSON.parse(readFileSync('messages/es.json', 'utf8')) as {
  SerialMonitor: { inputPlaceholder: string };
  Calculators: { cards: Record<string, { title: string }> };
  Workbench: {
    packs: Record<string, { title: string }>;
    urlParser: { edit: string };
  };
};

test('every calculator keeps a full-width usable panel', async ({ page }) => {
  test.setTimeout(120000);
  for (const id of CALC_IDS) {
    await page.goto(`/es/calculators?tab=${id}`);
    await expect(page.getByLabel('Elegí una calculadora')).toBeVisible();
    const panel = page.getByRole('tabpanel', { name: copy.Calculators.cards[id].title, exact: true });
    await expect(panel).toBeVisible();
    expect((await panel.boundingBox())!.width).toBeGreaterThan(page.viewportSize()!.width - 100);
    expect(await page.evaluate(inspectMobileLayout), id).toEqual([]);
  }
});

test('mobile calculator selector changes the tool and preserves the selected URL', async ({ page }) => {
  await page.goto('/es/calculators');
  await page.locator('[class*="mobileSelector"] .ant-select-selector').click();
  await page.getByLabel('Elegí una calculadora').fill('Filtro RC');
  await page.getByTitle('Filtro RC', { exact: true }).click();
  await expect(page).toHaveURL(/tab=rc/);
  await expect(page.locator('.ant-tabs-tabpane-active')).toContainText('Filtro RC');
  await page.reload();
  await expect(page.locator('.ant-tabs-tabpane-active')).toContainText('Filtro RC');
});

test('editors stack instead of squeezing their content on phones', async ({ page }) => {
  test.skip(page.viewportSize()!.width > 720, 'Tablet keeps two readable columns.');
  for (const tool of ['json-schema', 'csv-json']) {
    await page.goto(`/es/workbench/${tool}`);
    const editor = page.locator('[data-tool-content] [class*="editorGrid"]');
    await expect(editor).toBeVisible();
    const cards = editor.locator(':scope > .ant-card');
    const first = (await cards.nth(0).boundingBox())!;
    const second = (await cards.nth(1).boundingBox())!;
    expect(second.y).toBeGreaterThanOrEqual(first.y + first.height);
    expect(await page.evaluate(inspectMobileLayout)).toEqual([]);
  }
});

test('serial controls and command input remain inside the viewport', async ({ page }) => {
  await page.goto('/es/workbench/serial-monitor');
  const input = page.getByPlaceholder(copy.SerialMonitor.inputPlaceholder);
  await expect(input).toBeVisible();
  await expect(input).toBeDisabled();
  expect(await page.evaluate(inspectMobileLayout)).toEqual([]);
  expect((await input.boundingBox())!.width).toBeGreaterThan(150);
});

test('loaded statistics remain readable with real rows and large counts', async ({ page }) => {
  await page.route('**/api/stats/public', (route) => route.fulfill({ json: {
    rangeDays: 30, totals: { pageViews: 123456789, toolOpens: 987654, guestbook: 1234 },
    perDay: [{ day: '2026-10-01', count: 12 }],
    topTools: [{ toolId: 'llm-grammar-generator', count: 12345 }],
    countries: [{ country: 'AR', count: 1234 }], locales: [{ locale: 'es', count: 12 }],
  } }));
  await page.goto('/es/stats');
  await expect(page.getByText(copy.Workbench.packs['llm-grammar-generator'].title, { exact: true })).toBeVisible();
  expect(await page.evaluate(inspectMobileLayout)).toEqual([]);
});

test('long parameter names and URL editing remain usable', async ({ page }) => {
  await page.goto('/es/workbench/url-parser');
  const input = page.locator('[data-tool-content] input').first();
  await expect(input).toBeVisible();
  await input.fill(`https://example.com/?${'parameter'.repeat(20)}=${'value'.repeat(40)}`);
  await page.getByRole('button', { name: copy.Workbench.urlParser.edit, exact: true }).click();
  await expect(page.getByPlaceholder('key', { exact: true })).toBeVisible();
  expect(await page.evaluate(inspectMobileLayout)).toEqual([]);
});
