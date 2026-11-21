import { setRequestLocale } from 'next-intl/server';
import { translatedMetadata } from '@/lib/seo-metadata';
import { RadioLanding } from '@/components/radio/RadioLanding';

export const dynamic = 'force-static';
export const generateMetadata = translatedMetadata('/radio/programa', 'Radio');

export default async function RadioProgramPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <RadioLanding locale={locale} />;
}
