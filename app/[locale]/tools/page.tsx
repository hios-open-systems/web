import { setRequestLocale } from 'next-intl/server';
import { RecommendedSoftwareCatalog } from '@/components/tools/RecommendedSoftwareCatalog';


interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function ToolsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <RecommendedSoftwareCatalog />;
}
