import { getTranslations } from 'next-intl/server';
import { createPageMetadata, type PagePath } from './seo';

/** Reuse the same translated copy as the catalog instead of a second SEO map. */
export async function getTranslatedMetadata(
  locale: string,
  path: PagePath,
  namespace: string,
  descriptionKey = 'description',
  titleKey = 'title',
) {
  const t = await getTranslations({ locale, namespace });
  if (!t.has(titleKey) || !t.has(descriptionKey)) {
    throw new Error(`Missing SEO translations: ${locale}.${namespace}`);
  }
  return createPageMetadata(locale, path, `${t(titleKey)} | HIOS`, t(descriptionKey));
}

export function translatedMetadata(path: PagePath, namespace: string, descriptionKey = 'description', titleKey = 'title') {
  return async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    return getTranslatedMetadata(locale, path, namespace, descriptionKey, titleKey);
  };
}
