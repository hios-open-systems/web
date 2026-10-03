import { translatedMetadata } from '@/lib/seo-metadata';
import { setRequestLocale } from 'next-intl/server';
import { PublicStats } from '@/components/stats/PublicStats';

// Shell estático (SSG por locale); los números los trae el cliente desde
// /api/stats/public, que cachea en edge.
export const dynamic = 'force-static';

export const generateMetadata = translatedMetadata('/stats', 'Seo.stats', 'description');

const locales = ['en', 'es', 'de', 'it'];

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function StatsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <PublicStats />;
}
