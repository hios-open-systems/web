import type { Metadata } from 'next';
import { WiringGuideView } from '@/components/wiring-guide';
import { SPEAKER_WIRING } from '@/config/pinouts/speaker';
import { getTranslations, setRequestLocale } from 'next-intl/server';


// Fully static: prerenderizada por locale y servida del static-assets cache
// (open-next.config.ts). Evita el re-render SSR de antd en cada isolate frío.
export const dynamic = 'force-static';
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Pinouts.meta.speaker' });
  return { title: t('title'), description: t('description') };
}

const locales = ['en', 'es', 'de', 'it'];

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function SpeakerWiringPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <WiringGuideView guide={SPEAKER_WIRING} />;
}
