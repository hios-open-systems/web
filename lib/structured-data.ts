import { routing } from '../i18n/routing.ts';
import { getLocalizedPaths, SITE_URL, type PagePath } from './seo.ts';

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
export type StructuredData = { [key: string]: JsonValue };
export interface BreadcrumbItem { name: string; path: PagePath }

export function serializeStructuredData(data: StructuredData): string {
  return JSON.stringify(data).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
}

function pageUrl(locale: string, path: PagePath): string {
  if (!routing.locales.some((supported) => supported === locale)) throw new Error(`Unsupported locale: ${locale}`);
  return `${SITE_URL}${getLocalizedPaths(path)[locale]}`;
}

export function createBreadcrumbData(locale: string, items: readonly BreadcrumbItem[]): StructuredData {
  return {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem', position: index + 1, name: item.name, item: pageUrl(locale, item.path),
    })),
  };
}

export function createWebsiteData(): StructuredData {
  return {
    '@context': 'https://schema.org', '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`, url: `${SITE_URL}/`,
    name: 'HIOS', alternateName: 'HI Open Systems', inLanguage: [...routing.locales],
  };
}

export function createWebApplicationData(locale: string, path: PagePath, name: string, description: string): StructuredData {
  return {
    '@context': 'https://schema.org', '@type': 'WebApplication',
    '@id': `${pageUrl(locale, path)}#application`, url: pageUrl(locale, path),
    name, description, inLanguage: locale, isAccessibleForFree: true,
    isPartOf: { '@id': `${SITE_URL}/#website` },
  };
}

export function createArticleData(
  locale: string, path: PagePath,
  post: { title: string; summary: string; date: string; lang: string },
): StructuredData {
  return {
    '@context': 'https://schema.org', '@type': 'Article',
    '@id': `${pageUrl(locale, path)}#article`, url: pageUrl(locale, path),
    headline: post.title, description: post.summary, datePublished: post.date, inLanguage: post.lang,
    mainEntityOfPage: pageUrl(locale, path), isPartOf: { '@id': `${SITE_URL}/#website` },
  };
}

export function createProjectPageData(locale: string, path: PagePath, name: string, description: string): StructuredData {
  return {
    '@context': 'https://schema.org', '@type': 'WebPage', url: pageUrl(locale, path), name, description,
    isPartOf: { '@id': `${SITE_URL}/#website` },
  };
}
