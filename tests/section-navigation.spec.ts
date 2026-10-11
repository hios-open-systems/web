import { test, expect } from '@playwright/test';
import es from '../messages/es.json';
import en from '../messages/en.json';
import de from '../messages/de.json';
import it from '../messages/it.json';
import { checkSectionAccess, checkAccountAccess, translations } from './helpers/section-access';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

for (const [locale, copy] of Object.entries({ es, en, de, it })) {
  test(`${locale}: all sections remain accessible from the desktop navigation`, async ({ page }) => {
    await page.goto(`/${locale}/explore`);
    const nav = page.getByRole('navigation', { name: copy.Header.sections.label, exact: true });
    for (const [key, path] of Object.entries({ maker: 'prints', devlog: 'blog', pinouts: 'pinouts', calculators: 'calculators', composer: 'composer', software: 'tools', stats: 'stats', guestbook: 'guestbook', about: 'colophon' })) {
      const label = copy.Header.sections[key as keyof typeof copy.Header.sections];
      const link = nav.getByRole('link', { name: label, exact: true });
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute('href', `/${locale}/${path}`);
    }
  });
}

for (const locale of Object.keys(translations) as (keyof typeof translations)[]) {
  test(`${locale}: navigation opens every section`, async ({ page }) => {
    test.setTimeout(90000);
    await checkSectionAccess(page, locale);
  });
}
for (const kind of ['anonymous', 'member', 'owner'] as const) {
  test(`${kind}: desktop account access`, async ({ page }) => checkAccountAccess(page, kind));
}

test('every generated public page is reachable by links from its locale home', () => {
  const root = '.next/server/app';
  const files = readdirSync(root, { recursive: true }).filter((file): file is string =>
    typeof file === 'string' && file.endsWith('.html'));
  const pages = new Map(files.map(file => ['/' + file.replaceAll('\\', '/').slice(0, -5), readFileSync(join(root, file), 'utf8')]));
  for (const locale of Object.keys(translations)) {
    const home = `/${locale}`, reached = new Set([home]), queue = [home];
    while (queue.length) {
      for (const match of (pages.get(queue.shift()!) ?? '').matchAll(/<a\b[^>]*href="([^"]+)"/g)) {
        const path = match[1].split(/[?#]/)[0];
        if (pages.has(path) && !reached.has(path) && (path === home || path.startsWith(home + '/'))) {
          reached.add(path); queue.push(path);
        }
      }
    }
    const missing = [...pages.keys()].filter(path => path.startsWith(home + '/') && !reached.has(path))
      // Private owner page has a session-gated link; these two legacy URLs redirect.
      .filter(path => !['/admin', '/json', '/calculators/rcl'].some(suffix => path === home + suffix));
    expect(missing, locale).toEqual([]);
    expect(reached.size).toBeGreaterThan(80);
  }
});

test('recognizable section names and search destinations remain available', async ({ page }) => {
  expect(es.Header.workbench).toBe('Workbench');
  expect(es.Header.tools).toBe('Stack');
  expect(es.Header.sections.maker).toBe('Maker');
  expect(es.Header.sections.devlog).toBe('Devlog');
  await page.goto('/es');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  const dialog = page.getByRole('dialog');
  for (const [query, name] of [['Proyectos', 'Proyectos'], ['STL', 'Maker'], ['Stack', 'Stack'], ['Workbench', 'Workbench']]) {
    await dialog.getByRole('textbox').fill(query);
    await expect(dialog.getByText(name, { exact: true }).first()).toBeVisible();
  }
});

test('Maker navigation reaches working STL viewer and Devlog remains searchable', async ({ page }) => {
  await page.goto('/es/explore');
  await page.getByRole('navigation', { name: es.Header.sections.label }).getByRole('link', { name: es.Header.sections.maker }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(es.Header.sections.maker);
  await page.getByRole('button', { name: 'Ver en 3D', exact: true }).first().click();
  await expect(page.getByRole('button', { name: 'Cerrar', exact: true })).toBeVisible();
  await expect(page.locator('canvas')).toBeVisible();
  await page.getByRole('button', { name: 'Cerrar', exact: true }).click();
  await page.getByRole('button', { name: es.Header.search, exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('textbox').fill('Devlog');
  await dialog.getByText('Devlog', { exact: true }).click();
  await expect(page).toHaveURL(/\/es\/blog$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Devlog');
});
