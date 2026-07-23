import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { PublicStats } from '@/components/stats/PublicStats';

// Shell estático (SSG por locale); los números los trae el cliente desde
// /api/stats/public, que cachea en edge.
export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Stats | HIOS',
  description: 'Telemetría abierta y anónima de openhios.dev — opt-in, agregada, pública.',
};

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
