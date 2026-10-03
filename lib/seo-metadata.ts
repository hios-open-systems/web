import { getTranslations } from 'next-intl/server';
import { createPageMetadata, type PagePath } from './seo';

/** Reuse the same translated copy as the catalog instead of a second SEO map. */
export async function getTranslatedMetadata(
  locale: string,
  path: PagePath,
  namespace: string,
  descriptionKey = 'description',
) {
  const t = await getTranslations({ locale, namespace });
  if (!t.has('title') || !t.has(descriptionKey)) {
    throw new Error(`Missing SEO translations: ${locale}.${namespace}`);
  }
  return createPageMetadata(locale, path, `${t('title')} | HIOS`, t(descriptionKey));
}

export function translatedMetadata(path: PagePath, namespace: string, descriptionKey = 'description') {
  return async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    return getTranslatedMetadata(locale, path, namespace, descriptionKey);
  };
}
