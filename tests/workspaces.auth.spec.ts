import { test, expect } from '@playwright/test';
import type { BrowserContext } from '@playwright/test';
const origin = 'http://localhost:3202';
async function account(context: BrowserContext, id = 'a') {
  await context.addCookies([{ name: 'hios_session', value: `workspace-test-${id}-session`, url: origin }]);
}
test('D1 isolates accounts, detects stale revisions, and rejects implicit content uploads', async ({ browser }) => {
  const a = await browser.newContext(); const b = await browser.newContext();
  await account(a); await account(b, 'b');
  const id = crypto.randomUUID();
  const record = { id, revision: 0, document: { id, version: 1, name: 'Cloud desk', entries: [] } };
  const put = (context: BrowserContext, data: unknown, kind = 'workspaces') => context.request.put(`${origin}/api/user/${kind}`, { data, headers: { Origin: origin } });
  expect((await put(a, record)).status()).toBe(200);
  expect((await put(a, record)).status()).toBe(409);
  const other = await b.request.get(`${origin}/api/user/workspaces`);
  expect((await other.json()).records.some((row: { id: string }) => row.id === id)).toBe(false);
  expect((await put(a, { ...record, document: { id, version: 1, name: 'Private', toolId: 'payload', settings: {}, content: { payload: 'secret' }, syncContent: false } }, 'presets')).status()).toBe(400);
  const stranger = await browser.newContext();
  expect((await stranger.request.get(`${origin}/api/user/workspaces`)).status()).toBe(401);
  await Promise.all([a.close(), b.close(), stranger.close()]);
});

test('a workspace travels between two browser sessions', async ({ browser }) => {
  const a = await browser.newContext(); const b = await browser.newContext();
  await account(a); await account(b);
  const first = await a.newPage(); const second = await b.newPage();
  await first.goto(`${origin}/en/workbench/spaces`);
  await expect(first.getByRole('heading', { name: 'Cloud desk', exact: true })).toBeVisible();
  await first.getByRole('button', { name: 'New space', exact: true }).press('Enter');
  const name = `Cross-device ${Date.now()}`;
  await first.getByRole('textbox', { name: 'Name', exact: true }).fill(name);
  await first.getByRole('button', { name: 'OK', exact: true }).click();
  await expect(first.getByRole('heading', { name })).toBeVisible();
  await expect.poll(async () => {
    const response = await a.request.get(`${origin}/api/user/workspaces`);
    return (await response.json()).records.some((row: { document: { name: string } }) => row.document.name === name);
  }).toBe(true);
  await second.goto(`${origin}/en/workbench/spaces`);
  await expect(second.getByRole('combobox', { name: 'Select a space' })).toBeEnabled();
  await second.getByRole('combobox', { name: 'Select a space' }).press('Enter');
  await expect(second.getByText(name, { exact: true }).last()).toBeVisible();
  await Promise.all([a.close(), b.close()]);
});

test('offline changes recover and conflicting edits preserve both versions', async ({ browser }) => {
  const a = await browser.newContext(); await account(a);
  const page = await a.newPage();
  const id = crypto.randomUUID();
  const document = { id, version: 1, name: 'Initial', entries: [] };
  await a.request.put(`${origin}/api/user/workspaces`, { headers: { Origin: origin }, data: { id, revision: 0, document } });
  await page.goto(`${origin}/en/workbench/spaces`);
  await expect(page.getByRole('heading', { name: 'Cloud desk', exact: true })).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Select a space' })).toBeEnabled();
  await page.getByRole('combobox', { name: 'Select a space' }).press('Enter');
  await page.getByText('Initial', { exact: true }).last().click();
  await expect(page.getByRole('heading', { name: 'Initial', exact: true })).toBeVisible();
  await a.setOffline(true);
  await page.getByRole('button', { name: 'Rename', exact: true }).click();
  await page.getByRole('textbox', { name: 'Name', exact: true }).fill('Local edit');
  await page.getByRole('button', { name: 'OK', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Local edit', exact: true })).toBeVisible();
  const remote = await browser.newContext(); await account(remote);
  expect((await remote.request.put(`${origin}/api/user/workspaces`, { headers: { Origin: origin }, data: { id, revision: 1, document: { ...document, name: 'Remote edit' } } })).status()).toBe(200);
  await a.setOffline(false);
  await expect(page.getByRole('button', { name: 'Resolve by keeping this version' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Local edit' })).toBeVisible();
  await expect(page.locator('pre').filter({ hasText: 'Remote edit' })).toBeVisible();
  await page.getByRole('button', { name: 'Resolve by keeping this version' }).click();
  await expect.poll(async () => {
    const response = await remote.request.get(`${origin}/api/user/workspaces`);
    const names = (await response.json()).records.map((row: { document: { name: string } }) => row.document.name);
    return names.includes('Local edit') && names.includes('Remote edit (copy)');
  }).toBe(true);
  await Promise.all([a.close(), remote.close()]);
});
