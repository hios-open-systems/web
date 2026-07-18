import type { Metadata } from 'next';
import { PinoutsContent } from '@/components/pinouts/PinoutsContent';
import { getTranslations, setRequestLocale } from 'next-intl/server';


export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'Pinouts.meta.index' });
  return { title: t('title'), description: t('description') };
}

const locales = ['en', 'es', 'de', 'it'];

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default function PinoutsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);

  return (
    <div>
      <PinoutsContent />
    </div>
  );
}
