import { setRequestLocale } from 'next-intl/server';
import { translatedMetadata } from '@/lib/seo-metadata';
import { RepositoryReader } from '@/components/workbench/RepositoryReader';
export const dynamic = 'force-static';
export const generateMetadata = translatedMetadata('/workbench/repositories', 'Repositories', 'description');
export function generateStaticParams() { return ['en', 'es', 'de', 'it'].map(locale => ({ locale })); }
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params; setRequestLocale(locale);
  return <main><RepositoryReader /></main>;
}
