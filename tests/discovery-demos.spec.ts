import { test, expect } from '@playwright/test';

test('catalog counts match and favorites, recent and labeled filters work', async ({ page }, info) => {
  await page.goto('/es/workbench');
  const total = await page.locator('article[data-area]').count();
  await expect(page.getByText(total + ' herramientas', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Favoritos', exact: true }).click();
  await expect(page.locator('article[data-area]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Todas las herramientas', exact: true }).click();
  await page.locator('article[data-area]').first().getByRole('button').click();
  await page.getByRole('button', { name: 'Favoritos', exact: true }).click();
  await expect(page.locator('article[data-area]')).toHaveCount(1);
  await page.getByRole('button', { name: 'Limpiar filtros', exact: true }).click();
  await expect(page.locator('article[data-area]')).toHaveCount(total);
  await page.screenshot({ path: info.outputPath('workbench-discovery.png'), fullPage: false });
});

test('interactive demos are local, editable, transferable and stop audio on switch', async ({ page }, info) => {
  await page.addInitScript(() => {
    const Native = window.AudioContext;
    const contexts: AudioContext[] = [];
    Object.defineProperty(window, '__demoContexts', { value: contexts });
    window.AudioContext = class extends Native {
      constructor(options?: AudioContextOptions) { super(options); contexts.push(this); }
    };
  });
  const outbound: string[] = [];
  page.on('request', request => { if (!new URL(request.url()).hostname.match(/^(127\.0\.0\.1|localhost)$/)) outbound.push(request.url()); });
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/es');
  await page.getByRole('button', { name: 'Pinout', exact: true }).click();
  await page.getByRole('button', { name: 'SPK−', exact: false }).click();
  await expect(page.getByText('Salida negativa en puente. No conectar a GND.')).toBeVisible();
  await page.getByRole('button', { name: 'QPSK', exact: true }).click();
  await page.getByRole('button', { name: '11', exact: true }).click();
  await expect(page.getByText('I −1 · Q −1 · φ 225°')).toBeVisible();
  await page.getByRole('button', { name: 'Beat', exact: true }).click();
  expect(await page.evaluate(() => (window as unknown as { __demoContexts: AudioContext[] }).__demoContexts.length)).toBe(0);
  await page.getByRole('button', { name: 'Kick · 1', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Kick · 1', exact: true })).toHaveAttribute('aria-pressed', 'false');
  await page.getByRole('button', { name: 'Reproducir', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Detener', exact: true })).toBeVisible();
  await page.screenshot({ path: info.outputPath('landing-beat.png') });
  await page.getByRole('button', { name: 'Seguir en el compositor', exact: false }).click();
  await expect(page).toHaveURL(/composer\?handoff=/);
  await expect(page.getByRole('textbox', { name: 'Nombre de la canción' })).toHaveValue('HIOS · Trap sketch');
  await expect.poll(() => page.evaluate(() => (window as unknown as { __demoContexts: AudioContext[] }).__demoContexts.map(context => context.state))).toEqual(['closed']);
  const imported = await page.evaluate(() => {
    const id = new URLSearchParams(location.search).get('handoff');
    return JSON.parse(sessionStorage.getItem('hios-handoff:' + id) || '{}');
  });
  const song = JSON.parse(imported.values.song).song;
  expect(song.tracks[0].notes.some((note: { start: number }) => note.start === 0)).toBe(false);
  expect(song.name).toBe('HIOS · Trap sketch');
  expect(outbound).toEqual([]);
  expect(errors).toEqual([]);
});

for (const provider of ['github', 'gitlab']) test(provider + ' repository reader sends nothing before connect, keeps drafts in memory and never loads remote Markdown', async ({ page }) => {
  const calls: string[] = [];
  const api = provider === 'github' ? 'https://api.github.com' : 'https://gitlab.com/api/v4';
  await page.route(api + '/**', route => {
    calls.push(route.request().url());
    expect(route.request().method()).toBe('GET');
    expect(route.request().headers().authorization).toBe('Bearer synthetic-test-only');
    const url = route.request().url();
    const content = '# Private document\n![remote](https://example.com/pixel)\n<script>alert(1)</script>';
    const file = url.includes('README.md');
    return route.fulfill({ json: file && provider === 'github' ? { encoding: 'base64', content: Buffer.from(content).toString('base64') }
      : !file ? [{ name: 'README.md', path: 'README.md', type: provider === 'github' ? 'file' : 'blob' }] : undefined,
      body: file && provider === 'gitlab' ? content : undefined });
  });
  const leaks: string[] = [];
  page.on('request', request => { if (request.url().startsWith('https://example.com')) leaks.push(request.url()); });
  await page.goto('/es/workbench/repositories');
  expect(calls).toHaveLength(0);
  await page.getByLabel('URL del repositorio', { exact: true }).fill('https://' + provider + '.com/demo/private');
  await page.getByLabel('Token de lectura', { exact: true }).fill('synthetic-test-only');
  await page.getByRole('button', { name: 'Conectar y leer' }).click();
  await page.getByRole('button', { name: 'README.md', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Documento', exact: true })).toHaveValue(/Private document/);
  await page.getByRole('textbox', { name: 'Documento', exact: true }).fill('# Edited private draft\n![remote](https://example.com/pixel)');
  await page.getByRole('button', { name: 'Vista Markdown' }).click();
  await expect(page.getByRole('heading', { name: 'Edited private draft' })).toBeVisible();
  expect(leaks).toEqual([]);
  expect(await page.evaluate(() => JSON.stringify({ ...localStorage, ...sessionStorage }))).not.toMatch(/synthetic-test-only|Edited private draft/);
  await page.getByRole('button', { name: 'Desconectar y borrar memoria' }).click();
  await expect(page.getByRole('heading', { name: 'Edited private draft' })).toHaveCount(0);
  expect(calls).toHaveLength(2);
});
