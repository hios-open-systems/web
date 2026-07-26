import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { AdminPanel } from '@/components/admin/AdminPanel';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Admin | HIOS',
  robots: { index: false, follow: false },
};

const locales = ['en', 'es', 'de', 'it'];

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function AdminPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <AdminPanel />;
}
