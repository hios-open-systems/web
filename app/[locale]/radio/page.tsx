import { getTranslations, setRequestLocale } from 'next-intl/server';
import { translatedMetadata } from '@/lib/seo-metadata';
import { PageIntro } from '@/components/ui/PageIntro';
import { RadioBasicsTool } from '@/components/radio-basics/RadioBasicsTool';
import styles from '@/components/radio-basics/radioCourse.module.css';

// Fully static: prerenderizada por locale y servida del static-assets cache.
export const dynamic = 'force-static';
export const generateMetadata = translatedMetadata('/radio', 'Workbench.packs.radio-basics');

const locales = ['en', 'es', 'de', 'it'];
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function RadioPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'Workbench.packs.radio-basics' });
  const course = await getTranslations({ locale, namespace: 'RadioCourse' });
  return (
    <main className={styles.page}>
      <PageIntro eyebrow={course('eyebrow')} title={t('title')} description={t('description')} area="knowledge" compact />
      <RadioBasicsTool />
    </main>
  );
}
