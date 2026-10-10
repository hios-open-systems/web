import { setRequestLocale } from 'next-intl/server';
import { ExploreCatalog } from '@/components/workbench/ExploreCatalog';
import { translatedMetadata } from '@/lib/seo-metadata';

export const generateMetadata = translatedMetadata('/explore', 'Workspace', 'intro', 'explore');

export default async function ExplorePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <main style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px 56px' }}><ExploreCatalog /></main>;
}
