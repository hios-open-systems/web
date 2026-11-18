import { setRequestLocale } from 'next-intl/server';
import { translatedMetadata } from '@/lib/seo-metadata';
import { RadioLanding } from '@/components/radio/RadioLanding';

// Fully static: prerenderizada por locale y servida del static-assets cache.
export const dynamic = 'force-static';
export const generateMetadata = translatedMetadata('/radio', 'Radio');

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
  return <RadioLanding locale={locale} />;
}
