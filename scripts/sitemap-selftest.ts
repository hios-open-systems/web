import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { createLocalizedSitemap } from '../lib/seo-sitemap.ts';

const entries = createLocalizedSitemap(['', '/', '/composer', '/composer/'], 'https://example.com/');
assert.equal(entries.length, 8, 'Deduplicate overlapping catalogs and trailing slashes');
assert.deepEqual(entries.map((entry) => entry.url), [
  'https://example.com/en', 'https://example.com/es',
  'https://example.com/de', 'https://example.com/it',
  'https://example.com/en/composer', 'https://example.com/es/composer',
  'https://example.com/de/composer', 'https://example.com/it/composer',
]);
assert.equal(entries[4].alternates?.languages?.['x-default'], 'https://example.com/en/composer');
assert.ok(entries.every((entry) => !('lastModified' in entry)), 'Do not invent update dates');
assert.throws(() => createLocalizedSitemap(['/calculators?tab=rcl']), /pathname/);
assert.throws(() => createLocalizedSitemap(['/workbench#tools']), /pathname/);

function htmlFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = join(directory, entry.name);
    return entry.isDirectory() ? htmlFiles(file) : entry.name.endsWith('.html') ? [file] : [];
  });
}

function verifyBuild() {
  const root = join(process.cwd(), '.next/server/app');
  const xml = readFileSync(join(root, 'sitemap.xml.body'), 'utf8');
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, url]) => url);
  const unique = new Set(urls);
  assert.equal(unique.size, urls.length, 'No duplicate sitemap URLs');
  assert.doesNotMatch(xml, /<lastmod>/, 'No deployment timestamps');
  const expected = new Set<string>();
  for (const file of htmlFiles(root)) {
    const route = '/' + relative(root, file).split(sep).join('/').replace(/\.html$/, '');
    if (!/^\/(en|es|de|it)(\/|$)/.test(route)) continue;
    if (/\/admin$|\/workbench\/(settings|feedback)$/.test(route)) continue;
    const response = JSON.parse(readFileSync(file.replace(/\.html$/, '.meta'), 'utf8')) as { status?: number };
    if (response.status && response.status >= 300 && response.status < 400) continue;
    const html = readFileSync(file, 'utf8');
    const canonical = html.match(/<link rel="canonical" href="([^"]+)"/);
    assert.ok(canonical, `${route}: missing canonical`);
    expected.add(canonical[1]);
    assert.ok(unique.has(canonical[1]), `${route}: missing from sitemap`);
  }
  assert.deepEqual(unique, expected, 'Only existing canonical public pages belong in sitemap');
  for (const block of xml.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
    const url = block[1].match(/<loc>([^<]+)<\/loc>/)?.[1];
    assert.ok(url);
    const parsed = new URL(url);
    const suffix = parsed.pathname.replace(/^\/(en|es|de|it)/, '');
    const links = [...block[1].matchAll(/hreflang="([^"]+)" href="([^"]+)"/g)];
    assert.equal(links.length, 5, `${url}: four languages and x-default`);
    for (const [, language, href] of links) {
      assert.equal(href, `${parsed.origin}/${language === 'x-default' ? 'en' : language}${suffix}`);
      assert.ok(unique.has(href), `${url}: alternate missing from sitemap`);
    }
  }
  console.log(`Sitemap: ${unique.size} canonical URLs verified against rendered pages.`);
}

if (process.argv.includes('--built')) verifyBuild();
console.log('Sitemap checks passed.');
