import type { Metadata } from 'next';
import { WiringGuideView } from '@/components/wiring-guide';
import { PAD_WIRING } from '@/config/pinouts/pad';
import { getTranslations, setRequestLocale } from 'next-intl/server';

export const runtime = 'edge';

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'Pinouts.meta.pad' });
  return { title: t('title'), description: t('description') };
}

const locales = ['en', 'es', 'de', 'it'];

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default function PadWiringPage({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);

  return <WiringGuideView guide={PAD_WIRING} />;
}
