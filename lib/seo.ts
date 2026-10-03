import type { Metadata } from 'next';
import { routing } from '../i18n/routing.ts';

type PagePath = '' | `/${string}`;
type LocaleParams = { params: Promise<{ locale: string }> };

/** Paths are locale-free and contain no query or fragment: those are UI state. */
export function getPageAlternates(locale: string, path: PagePath): Metadata['alternates'] {
  if (!routing.locales.some((supported) => supported === locale)) {
    throw new Error(`Unsupported SEO locale: ${locale}`);
  }
  if (/[?#]/.test(path) || path.includes('//')) {
    throw new Error(`SEO path must be a pathname: ${path}`);
  }
  const pathname = path.replace(/\/+$/, '');
  const localizedPath = (language: string) => `/${language}${pathname}`;

  return {
    canonical: localizedPath(locale),
    languages: {
      ...Object.fromEntries(routing.locales.map((language) => [language, localizedPath(language)])),
      'x-default': localizedPath(routing.defaultLocale),
    },
  };
}

/** Use in each page, never in an ancestor layout: metadata is inherited. */
export function localizedMetadata(path: PagePath, metadata: Metadata = {}) {
  return async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
    const { locale } = await params;
    return { ...metadata, alternates: getPageAlternates(locale, path) };
  };
}
