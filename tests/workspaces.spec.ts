import { test, expect } from '@playwright/test';
import en from '../messages/en.json';

test.beforeEach(async ({ page }) => {
  await page.route('**/api/auth/me', route => route.fulfill({ json: { user: null } }));
});

test('Explore saves a resource, exposes its destination and opens it after reload', async ({ page }) => {
  await page.goto('/en/explore');
  await page.getByRole('textbox', { name: 'Search by name or task…' }).fill('JSON');
  await expect(page.getByRole('heading', { name: en.Workbench.packs['tone-generator'].title, exact: true })).toHaveCount(0);
  const card = page.getByRole('article').filter({ has: page.getByRole('heading', { name: en.Workbench.packs.payload.title, exact: true }) });
  await card.getByRole('button', { name: 'Add to space', exact: true }).click();
  await page.getByRole('menuitem', { name: 'New space', exact: true }).click();
  await expect(card.getByRole('button', { name: 'Saved', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'My spaces', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'My space', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('link', { name: en.Workbench.packs.payload.title, exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Organize', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Remove', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Remove', exact: true })).toHaveCount(0);
  await page.getByRole('link', { name: en.Workbench.packs.payload.title, exact: true }).click();
  await expect(page).toHaveURL(/\/en\/workbench\/payload$/);
});

test('spaces can be renamed and deleted with a cancelable confirmation', async ({ page }) => {
  await page.goto('/en/workbench/spaces');
  await page.getByRole('button', { name: 'New space', exact: true }).click();
  await page.getByRole('textbox', { name: 'Name', exact: true }).fill('Test workspace');
  await page.getByRole('button', { name: 'OK', exact: true }).click();
  await page.getByRole('button', { name: 'Space options', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Rename', exact: true }).click();
  await page.getByRole('textbox', { name: 'Name', exact: true }).fill('Renamed workspace');
  await page.getByRole('button', { name: 'OK', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Renamed workspace', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Space options', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Delete', exact: true }).click();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Renamed workspace', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Space options', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Delete', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Renamed workspace', exact: true })).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Create my first space', exact: true })).toBeVisible();
});

test('template spaces can be duplicated and edited without changing the original', async ({ page }) => {
  await page.goto('/en/workbench/spaces');
  await page.getByText('Or start with a selection', { exact: true }).click();
  await page.getByRole('combobox', { name: 'Template', exact: true }).press('ArrowDown');
  await page.getByRole('combobox', { name: 'Template', exact: true }).press('Enter');
  await page.getByRole('textbox', { name: 'Name', exact: true }).fill('Development desk');
  await page.getByRole('button', { name: 'OK', exact: true }).click();
  await expect(page.getByText('4 resources', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Space options', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Duplicate', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Development desk (copy)', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Organize', exact: true }).click();
  await page.getByRole('button', { name: 'Remove', exact: true }).first().click();
  await expect(page.getByText('3 resources', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Development desk', exact: true }).click();
  await expect(page.getByText('4 resources', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: en.Workbench.packs.payload.title, exact: true })).toBeVisible();
});

test('catalog search and personal space survive reload', async ({ page }) => {
  await page.goto('/en/workbench');
  await page.getByRole('textbox', { name: 'Search tools or tasks…' }).fill('payload');
  await expect(page.getByRole('link', { name: en.Workbench.packs.payload.title, exact: true })).toBeVisible();
  await page.goto('/en/workbench/spaces');
  await page.getByRole('button', { name: 'New space', exact: true }).click();
  await page.getByRole('textbox', { name: 'Name', exact: true }).fill('API desk');
  await page.getByRole('button', { name: 'OK', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'API desk' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'API desk' })).toBeVisible();
});

test('payload can transfer a selected subset without exposing it in URL', async ({ page }) => {
  await page.goto('/en/workbench/payload');
  await page.getByRole('textbox', { name: 'Input', exact: true }).fill('{"privateSentinel":{"answer":42}}');
  await page.getByRole('button', { name: 'privateSentinel: 1', exact: true }).click();
  await page.getByRole('button', { name: /Send to/ }).click();
  await page.getByRole('menuitem', { name: en.Workbench.packs['object-to-types'].title, exact: true }).click();
  await expect(page).toHaveURL(/object-to-types\?handoff=/);
  expect(page.url()).not.toContain('privateSentinel');
  await expect(page.locator('textarea').first()).toHaveValue(/"answer": 42/);
  await expect(page.locator('textarea').first()).not.toHaveValue(/privateSentinel/);
});

test('payload invalid input recovers and new presets restore', async ({ page }) => {
  await page.goto('/en/workbench/payload');
  const input = page.getByRole('textbox', { name: 'Input', exact: true });
  await input.fill('{broken');
  await expect(page.getByText('Invalid JSON', { exact: true })).toBeVisible();
  await input.fill('{"roundTrip":123}');
  await expect(page.getByRole('button', { name: 'roundTrip: 123' })).toBeVisible();
  await page.getByRole('button', { name: 'Save preset', exact: true }).click();
  await page.getByRole('textbox', { name: 'Name', exact: true }).fill('Round trip');
  await page.getByRole('button', { name: 'OK', exact: true }).click();
  await page.goto('/en/workbench/spaces');
  await page.getByRole('button', { name: 'Open', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Input', exact: true })).toHaveValue('{"roundTrip":123}');
});

test('payload worker can be cancelled before parsing and handles deep data', async ({ page }) => {
  await page.goto('/en/workbench/payload');
  const input = page.getByRole('textbox', { name: 'Input', exact: true });
  await input.fill('['.repeat(100) + '0' + ']'.repeat(100));
  await expect(page.getByText('Partial analysis', { exact: true })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Input', exact: true })).toBeEditable();
});
