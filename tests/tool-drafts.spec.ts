import { test, expect, type Page } from '@playwright/test';
import en from '../messages/en.json';

const key = (id: string) => `hios:tool-draft:v1:${id}`;
test.beforeEach(async ({ page }) => {
  await page.route('**/api/auth/me', route => route.fulfill({ json: { user: null } }));
});
async function seed(page: Page, id: string, values: Record<string, string>) {
  await page.goto('/en/explore');
  await page.evaluate(([name, value]) => localStorage.setItem(name, value), [key(id), JSON.stringify(values)]);
}

test('text and options survive leaving the tool, locale change and reload', async ({ page }) => {
  await page.goto('/en/workbench/hash-digest');
  const input = page.getByRole('textbox', { name: en.Workbench.hashDigest.inputLabel });
  await input.fill('Unfinished local work');
  await page.getByText('SHA-512', { exact: true }).click();
  await page.goto('/en/workbench/encoder');
  await page.goto('/en/workbench/hash-digest');
  await expect(input).toHaveValue('Unfinished local work');
  await expect(page.locator('.ant-segmented-item-selected')).toHaveText('SHA-512');
  await page.goto('/es/workbench/hash-digest');
  await expect(page.locator('textarea:not([aria-hidden=true])')).toHaveValue('Unfinished local work');
  await page.reload();
  await expect(page.locator('textarea:not([aria-hidden=true])')).toHaveValue('Unfinished local work');
});

test('explicit URL and handoff win over a previous draft', async ({ page }) => {
  await seed(page, 'encoder', { input: 'old draft', mode: 'base64', dir: 'encode' });
  await page.goto('/en/workbench/encoder?input=from-link&mode=base64&dir=encode');
  await expect(page.locator('textarea:not([aria-hidden=true])').first()).toHaveValue('from-link');
  await page.evaluate(() => sessionStorage.setItem('hios-handoff:draft-test', JSON.stringify({
    version: 1, toolId: 'encoder', values: { input: 'from-preset', mode: 'base64', dir: 'encode' }, createdAt: Date.now(),
  })));
  await page.goto('/en/workbench/encoder?handoff=draft-test');
  await expect(page.locator('textarea:not([aria-hidden=true])').first()).toHaveValue('from-preset');
});

test('clearing text remains empty on return', async ({ page }) => {
  await page.goto('/en/workbench/hash-digest');
  await page.locator('textarea:not([aria-hidden=true])').fill('temporary');
  await page.getByRole('button', { name: en.Workbench.hashDigest.clear, exact: true }).click();
  await page.reload();
  await expect(page.locator('textarea:not([aria-hidden=true])')).toHaveValue('');
});

test('field bindings restore validated options and keep HMAC secrets out of storage', async ({ page }) => {
  await seed(page, 'hmac', { algo: 'invalid', text: 'my message', secret: 'should-not-restore' });
  await page.goto('/en/workbench/hmac');
  await expect(page.locator('textarea:not([aria-hidden=true])')).toHaveValue('my message');
  await expect(page.locator('.ant-segmented-item-selected')).toHaveText('SHA-256');
  await expect(page.locator('input[type=password]')).toHaveValue('key');
  await page.locator('input[type=password]').fill('private-hmac-secret');
  await page.locator('textarea:not([aria-hidden=true])').fill('updated message');
  await expect.poll(() => page.evaluate(name => localStorage.getItem(name), key('hmac'))).not.toContain('secret');
  await page.reload();
  await expect(page.locator('textarea:not([aria-hidden=true])')).toHaveValue('updated message');
  await expect(page.locator('input[type=password]')).toHaveValue('key');
});

test('malformed and blocked storage do not stop editing', async ({ page }) => {
  await page.goto('/en/explore');
  await page.evaluate(name => localStorage.setItem(name, '{invalid'), key('hash-digest'));
  await page.goto('/en/workbench/hash-digest');
  await page.locator('textarea:not([aria-hidden=true])').fill('recovered');
  await expect.poll(() => page.evaluate(name => localStorage.getItem(name), key('hash-digest'))).toContain('recovered');
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => { throw new Error('blocked'); };
    Storage.prototype.setItem = () => { throw new Error('blocked'); };
  });
  await page.reload();
  await page.locator('textarea:not([aria-hidden=true])').fill('still usable');
  await expect(page.locator('textarea:not([aria-hidden=true])')).toHaveValue('still usable');
});

test('network drafts restore inputs without running a lookup', async ({ page }) => {
  await seed(page, 'dns-lookup', { domain: 'example.org', recordType: 'MX' });
  const lookups: string[] = [];
  await page.route('**/api/workbench/**', route => { lookups.push(route.request().url()); return route.abort(); });
  await page.goto('/en/workbench/dns-lookup');
  await expect(page.getByRole('textbox').first()).toHaveValue('example.org');
  await expect(page.locator('.ant-select-selection-item').filter({ hasText: /^MX$/ })).toHaveText('MX');
  expect(lookups).toEqual([]);
});

test('metronome options return with playback stopped', async ({ page }) => {
  await seed(page, 'metronome', { bpm: '173', beats: '7', subdivision: '2' });
  await page.goto('/en/workbench/metronome');
  await expect(page.getByRole('spinbutton').first()).toHaveValue('173');
  await expect(page.getByRole('button', { name: /Iniciar/ })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('spinbutton').first()).toHaveValue('173');
});

test('Beatmaker keeps the edited project without starting playback', async ({ page }) => {
  await page.goto('/en/workbench/beatmaker');
  await page.getByRole('spinbutton').first().fill('137');
  await page.getByRole('spinbutton').first().press('Tab');
  await expect.poll(() => page.evaluate(name => localStorage.getItem(name), key('beatmaker'))).not.toBeNull();
  await page.goto('/en/explore');
  await page.goto('/en/workbench/beatmaker');
  await expect(page.getByRole('spinbutton').first()).toHaveValue('137');
  await expect(page.getByRole('button', { name: /Play Loop/ })).toBeVisible();
});

test('calculator inputs and selected calculator survive returning from a clean link', async ({ page }) => {
  await page.goto('/en/calculators?tab=led&supply=9');
  await expect.poll(() => page.evaluate(name => localStorage.getItem(name), key('embedded'))).toContain('"supply":"9"');
  await page.goto('/en/explore');
  await page.goto('/en/calculators');
  await expect(page).toHaveURL(/supply=9/);
});

for (const id of ['image-convert', 'image-base64']) {
  test(`${id} restores its local file and clearing removes it`, async ({ page }) => {
    await page.goto(`/en/workbench/${id}`);
    const png = await page.evaluate(() => { const canvas = document.createElement('canvas'); canvas.width = 4; canvas.height = 4; return canvas.toDataURL().split(',')[1]; });
    await page.locator('input[type=file]').setInputFiles({ name: 'draft.png', mimeType: 'image/png',
      buffer: Buffer.from(png, 'base64') });
    await expect(page.getByText('draft.png', { exact: false }).first()).toBeVisible();
    await page.reload();
    await expect(page.getByText('draft.png', { exact: false }).first()).toBeVisible();
    await page.getByRole('button', { name: /^(Limpiar|Clear)$/ }).click();
    await page.reload();
    await expect(page.locator('input[type=file]')).toBeAttached();
    await expect(page.getByText('draft.png', { exact: false })).toHaveCount(0);
  });
}

test('UUID output stays identical across reloads, including its own query parameters', async ({ page }) => {
  await page.goto('/en/workbench/uuid-ulid');
  const output = page.locator('button[aria-label]').filter({ has: page.locator('svg') });
  await expect(page.getByRole('spinbutton')).toHaveValue('5');
  await expect.poll(() => page.evaluate(name => localStorage.getItem(name), key('uuid-ulid'))).toContain('generated');
  const before = await page.evaluate(name => JSON.parse(localStorage.getItem(name)!).generated as string, key('uuid-ulid'));
  expect(JSON.parse(before)).toHaveLength(5);
  await page.reload();
  await expect(output.first()).toBeAttached();
  await expect.poll(() => page.evaluate(name => JSON.parse(localStorage.getItem(name)!).generated as string, key('uuid-ulid'))).toBe(before);
  await expect(page.getByText(JSON.parse(before)[0], { exact: true })).toBeVisible();
});

test('notes reopen the selected document instead of the first note', async ({ page }) => {
  await page.goto('/en/workbench/notes');
  const title = page.getByRole('textbox', { name: en.Workbench.notes.titlePlaceholder });
  await title.fill('First saved note');
  await page.getByRole('button', { name: en.Workbench.notes.newNote }).click();
  await title.fill('Second saved note');
  await page.getByRole('button', { name: 'First saved note', exact: true }).click();
  await page.reload();
  await expect(title).toHaveValue('First saved note');
});

test('Payload remembers its view and splitter', async ({ page }) => {
  await seed(page, 'payload', { payload: '{"draft":true}', view: 'pretty', split: '63', tab: 'output', selectedPath: '[]' });
  await page.goto('/en/workbench/payload');
  await expect(page.locator('textarea:not([aria-hidden=true])')).toHaveValue('{"draft":true}');
  await expect(page.getByRole('tab', { name: en.Workspace.output, exact: true })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('input[type=range]')).toHaveValue('63');
});

test('audio file returns paused and clear removes it', async ({ page }) => {
  await page.goto('/en/workbench/audio-convert');
  const wav = Buffer.alloc(2044);
  wav.write('RIFF'); wav.writeUInt32LE(2036, 4); wav.write('WAVEfmt ', 8); wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22); wav.writeUInt32LE(8000, 24); wav.writeUInt32LE(16000, 28);
  wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34); wav.write('data', 36); wav.writeUInt32LE(2000, 40);
  await page.locator('input[type=file]').setInputFiles({ name: 'draft.wav', mimeType: 'audio/wav', buffer: wav });
  await expect(page.getByText('draft.wav', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText('draft.wav', { exact: true })).toBeVisible();
  await expect.poll(() => page.locator('audio').evaluate((audio: HTMLAudioElement) => audio.paused)).toBe(true);
  await page.getByRole('button', { name: 'Limpiar', exact: true }).click();
  await page.reload();
  await expect(page.locator('input[type=file]')).toBeAttached();
});
