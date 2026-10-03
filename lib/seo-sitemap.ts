import type { MetadataRoute } from 'next';
import { routing } from '../i18n/routing.ts';
import { getLocalizedPaths, SITE_URL, type PagePath } from './seo.ts';

/** Only canonical public paths; duplicate catalog links become a single entry. */
export function createLocalizedSitemap(
  paths: readonly PagePath[],
  siteUrl = SITE_URL,
): MetadataRoute.Sitemap {
  const site = siteUrl.replace(/\/$/, '');
  const entries = new Map<string, MetadataRoute.Sitemap[number]>();
  for (const path of paths) {
    const localizedPaths = getLocalizedPaths(path);
    const languages = Object.fromEntries(
      Object.entries(localizedPaths).map(([locale, pathname]) => [locale, `${site}${pathname}`]),
    );
    for (const locale of routing.locales) {
      const url = languages[locale];
      // Omit lastModified until the content has a reliable last-update source.
      // Deployment time and filesystem mtime do not represent content updates.
      entries.set(url, { url, alternates: { languages } });
    }
  }
  return [...entries.values()];
}
