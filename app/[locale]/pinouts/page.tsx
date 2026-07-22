import type { Metadata } from 'next';
import { PinoutsContent } from '@/components/pinouts/PinoutsContent';
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
  const t = await getTranslations({ locale, namespace: 'Pinouts.meta.index' });
  return { title: t('title'), description: t('description') };
}

const locales = ['en', 'es', 'de', 'it'];

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function PinoutsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div>
      <PinoutsContent />
    </div>
  );
}
