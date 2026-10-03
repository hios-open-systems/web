import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { createPageMetadata, getPageAlternates, localizedMetadata } from '../lib/seo.ts';
import { verifyPageMetadata } from './seo-metadata-check.ts';

const languages = ['en', 'es', 'de', 'it'];

for (const locale of languages) {
  const alternates = getPageAlternates(locale, '/pinouts/btdac/');
  assert.equal(alternates?.canonical, `/${locale}/pinouts/btdac`);
  assert.deepEqual(alternates?.languages, {
    en: '/en/pinouts/btdac', es: '/es/pinouts/btdac',
    de: '/de/pinouts/btdac', it: '/it/pinouts/btdac',
    'x-default': '/en/pinouts/btdac',
  });
  assert.equal(getPageAlternates(locale, '')?.canonical, `/${locale}`);
}
assert.throws(() => getPageAlternates('fr', '/pinouts'), /Unsupported/);
assert.throws(() => getPageAlternates('en', '//example.com'), /pathname/);
assert.throws(() => getPageAlternates('en', '/calculators?tab=rcl'), /pathname/);
assert.throws(() => getPageAlternates('en', '/workbench#tools'), /pathname/);
const metadata = await localizedMetadata('/workbench', {
  title: 'Workbench', robots: { index: false },
})({ params: Promise.resolve({ locale: 'es' }) });
assert.equal(metadata.title, 'Workbench');
assert.deepEqual(metadata.robots, { index: false });
assert.equal(metadata.alternates?.canonical, '/es/workbench');
const preview = createPageMetadata('de', '/workbench/hmac', 'HMAC | HIOS', 'Lokale HMAC-Berechnung.');
assert.equal(preview.title, 'HMAC | HIOS');
assert.equal(preview.description, 'Lokale HMAC-Berechnung.');
assert.equal(preview.openGraph?.title, preview.title);
assert.equal(preview.twitter?.description, preview.description);

function htmlFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = join(directory, entry.name);
    return entry.isDirectory() ? htmlFiles(file) : entry.name.endsWith('.html') ? [file] : [];
  });
}

/** Check the rendered output, including dynamic tools, articles and projects. */
function verifyBuild() {
  const root = join(process.cwd(), '.next/server/app');
  let checked = 0;
  for (const file of htmlFiles(root)) {
    const route = '/' + relative(root, file).split(sep).join('/').replace(/\.html$/, '');
    const [, locale, ...segments] = route.split('/');
    if (!languages.includes(locale)) continue;
    const response = JSON.parse(readFileSync(file.replace(/\.html$/, '.meta'), 'utf8')) as { status?: number };
    if (response.status && response.status >= 300 && response.status < 400) continue;
    const html = readFileSync(file, 'utf8');
    const links = [...html.matchAll(/<link\b[^>]*>/g)].map(([tag]) =>
      Object.fromEntries([...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map(([, key, value]) => [key, value])),
    );
    const canonical = links.filter((link) => link.rel === 'canonical');
    const alternates = links.filter((link) => link.rel === 'alternate' && link.hrefLang);
    if (segments[0] === 'admin') {
      assert.equal(canonical.length, 0, 'Admin must not inherit homepage canonical');
      assert.equal(alternates.length, 0, 'Admin must not inherit homepage hreflang');
      assert.match(html, /name="robots" content="noindex, nofollow"/);
      continue;
    }
    assert.equal(canonical.length, 1, `${route}: exactly one canonical`);
    const url = new URL(canonical[0].href);
    assert.equal(url.pathname, route, `${route}: self canonical`);
    assert.equal(alternates.length, 5, `${route}: all languages plus x-default`);
    for (const language of [...languages, 'x-default']) {
      const link = alternates.find((item) => item.hrefLang === language);
      assert.ok(link, `${route}: missing ${language}`);
      const expectedLocale = language === 'x-default' ? 'en' : language;
      assert.equal(link.href, `${url.origin}/${[expectedLocale, ...segments].join('/')}`, route);
    }
    verifyPageMetadata(html, route);
    checked++;
  }
  assert.ok(checked >= 40, `Expected full localized build, found ${checked} pages`);
  console.log(`SEO: ${checked} rendered pages verified.`);
}

if (process.argv.includes('--built')) verifyBuild();
console.log('SEO metadata checks passed.');
