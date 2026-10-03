import { translatedMetadata } from '@/lib/seo-metadata';
import { setRequestLocale } from 'next-intl/server';
import { GuestbookClient } from '@/components/guestbook/GuestbookClient';

export const dynamic = 'force-static';

export const generateMetadata = translatedMetadata('/guestbook', 'Guestbook', 'subtitle');

const locales = ['en', 'es', 'de', 'it'];

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function GuestbookPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <GuestbookClient />;
}
