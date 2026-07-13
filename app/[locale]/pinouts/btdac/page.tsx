import type { Metadata } from 'next';
import { WiringGuideView } from '@/components/wiring-guide';
import { BTDAC_WIRING } from '@/config/pinouts/btdac';
import { getTranslations, setRequestLocale } from 'next-intl/server';

export const runtime = 'edge';

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'Pinouts.meta.btdac' });
  return { title: t('title'), description: t('description') };
}

const locales = ['en', 'es', 'de', 'it'];

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default function BtdacWiringPage({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);

  return <WiringGuideView guide={BTDAC_WIRING} />;
}
