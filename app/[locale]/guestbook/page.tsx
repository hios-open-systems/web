import { localizedMetadata } from '@/lib/seo';
import { setRequestLocale } from 'next-intl/server';
import { GuestbookClient } from '@/components/guestbook/GuestbookClient';

export const dynamic = 'force-static';

export const generateMetadata = localizedMetadata('/guestbook', {
  title: 'Guestbook | HIOS',
  description: 'Firmá el libro de visitas de openhios.dev.',
});

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
