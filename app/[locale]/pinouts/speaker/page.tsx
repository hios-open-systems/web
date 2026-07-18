import type { Metadata } from 'next';
import { WiringGuideView } from '@/components/wiring-guide';
import { SPEAKER_WIRING } from '@/config/pinouts/speaker';
import { getTranslations, setRequestLocale } from 'next-intl/server';


export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'Pinouts.meta.speaker' });
  return { title: t('title'), description: t('description') };
}

const locales = ['en', 'es', 'de', 'it'];

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default function SpeakerWiringPage({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);

  return <WiringGuideView guide={SPEAKER_WIRING} />;
}
