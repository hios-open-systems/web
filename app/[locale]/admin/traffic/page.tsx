import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { SensitiveTraffic } from '@/components/admin/SensitiveTraffic';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Tráfico sensible | Admin | HIOS',
  robots: { index: false, follow: false },
};

const locales = ['en', 'es', 'de', 'it'];

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function AdminTrafficPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <SensitiveTraffic />;
}
