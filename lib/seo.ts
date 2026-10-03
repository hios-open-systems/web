import type { Metadata } from 'next';
import { routing } from '../i18n/routing.ts';

export const SITE_URL = (process.env.AUTH_BASE_URL || 'https://openhios.dev').replace(/\/$/, '');

export type PagePath = '' | `/${string}`;
type LocaleParams = { params: Promise<{ locale: string }> };

/** Shared by HTML metadata and the sitemap to keep language clusters identical. */
export function getLocalizedPaths(path: PagePath): Record<string, string> {
  if ((path !== '' && !path.startsWith('/')) || /[?#]/.test(path) || path.includes('//')) {
    throw new Error(`SEO path must be a pathname: ${path}`);
  }
  const pathname = path.replace(/\/+$/, '');
  const localizedPath = (language: string) => `/${language}${pathname}`;

  return {
    ...Object.fromEntries(routing.locales.map((language) => [language, localizedPath(language)])),
    'x-default': localizedPath(routing.defaultLocale),
  };
}

/** Paths are locale-free and contain no query or fragment: those are UI state. */
export function getPageAlternates(locale: string, path: PagePath): Metadata['alternates'] {
  if (!routing.locales.some((supported) => supported === locale)) {
    throw new Error(`Unsupported SEO locale: ${locale}`);
  }
  const languages = getLocalizedPaths(path);
  return { canonical: languages[locale], languages };
}

/** Use in each page, never in an ancestor layout: metadata is inherited. */
export function localizedMetadata(path: PagePath, metadata: Metadata = {}) {
  return async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
    const { locale } = await params;
    return { ...metadata, alternates: getPageAlternates(locale, path) };
  };
}
