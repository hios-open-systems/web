import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

type Messages = { [key: string]: string | Messages };
const cache = new Map<string, Messages>();
const pageNamespaces: Record<string, [string, string, string?]> = {
  '/explore': ['Workspace', 'intro', 'explore'],
  '/workbench/spaces': ['Workspace', 'intro', 'mySpaces'],
  '': ['Hero', 'subtitle'],
  '/tools': ['Tools', 'subtitle'], '/projects': ['Projects', 'subtitle'],
  '/workbench': ['Workbench.landing', 'subtitle'], '/guestbook': ['Guestbook', 'subtitle'],
  '/calculators': ['Workbench.packs.embedded', 'description'],
  '/composer': ['Workbench.packs.chiptune', 'description'],
  '/blog': ['Seo.blog', 'description'], '/prints': ['Seo.prints', 'description'],
  '/stats': ['Seo.stats', 'description'], '/colophon': ['Seo.colophon', 'description'],
  '/pinouts': ['Pinouts.meta.index', 'description'],
  '/pinouts/btdac': ['Pinouts.meta.btdac', 'description'],
  '/pinouts/pad': ['Pinouts.meta.pad', 'description'],
  '/pinouts/speaker': ['Pinouts.meta.speaker', 'description'],
};

function message(locale: string, key: string): string {
  if (!cache.has(locale)) {
    cache.set(locale, JSON.parse(readFileSync(`messages/${locale}.json`, 'utf8')) as Messages);
  }
  let value: string | Messages = cache.get(locale)!;
  for (const segment of key.split('.')) {
    assert.equal(typeof value, 'object', `${locale}.${key}`);
    value = (value as Messages)[segment];
  }
  assert.equal(typeof value, 'string', `${locale}.${key} must be translated`);
  return value as string;
}

function decode(value: string): string {
  const entities: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", '#x27': "'", '#39': "'" };
  return value.replace(/&([^;]+);/g, (entity, key: string) => entities[key] ?? entity);
}

/** Compare the rendered tags with actual locale copy, not with the implementation. */
export function verifyPageMetadata(html: string, route: string) {
  const [, locale, ...segments] = route.split('/');
  const path = segments.length ? '/' + segments.join('/') : '';
  if (['/workbench/settings', '/workbench/feedback'].includes(path)) return;
  const title = decode(html.match(/<title>([^<]*)<\/title>/)?.[1] ?? '');
  const tags = Object.fromEntries([...html.matchAll(/<meta\b[^>]*>/g)].map(([tag]) => {
    const attributes = Object.fromEntries([...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map(([, key, value]) => [key, decode(value)]));
    return [attributes.name ?? attributes.property, attributes.content];
  }));
  assert.ok(title && tags.description, `${route}: descriptive metadata required`);
  assert.equal(tags['og:title'], title, route);
  assert.equal(tags['twitter:title'], title, route);
  assert.equal(tags['og:description'], tags.description, route);
  assert.equal(tags['twitter:description'], tags.description, route);
  const canonical = decode(html.match(/<link rel="canonical" href="([^"]+)"/)?.[1] ?? '');
  assert.equal(tags['og:url'], canonical, `${route}: social URL matches canonical`);
  assert.equal(tags['og:locale'], locale, route);
  assert.ok(tags['og:image'].endsWith(`/og/${locale}.png`), route);
  const config = pageNamespaces[path] ?? (path.startsWith('/workbench/')
    ? [`Workbench.packs.${segments[1]}`, 'description'] : undefined);
  if (!config) return; // Articles and project descriptions retain their original content language.
  const [namespace, descriptionKey, titleKey = 'title'] = config;
  const translatedTitle = message(locale, `${namespace}.${titleKey}`);
  assert.equal(title, namespace.startsWith('Pinouts.') ? translatedTitle : `${translatedTitle} | HIOS`, route);
  assert.equal(tags.description, message(locale, `${namespace}.${descriptionKey}`), route);
}
