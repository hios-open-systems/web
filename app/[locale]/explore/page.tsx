import { setRequestLocale, getTranslations } from 'next-intl/server';
import { ExploreActivities } from '@/components/landing/ExploreActivities';
export default async function ExplorePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Workspace');
  return <main style={{ maxWidth: 1440, margin: '0 auto', padding: '32px 24px 56px' }}><h1>{t('explore')}</h1><ExploreActivities heading={false} /></main>;
}
