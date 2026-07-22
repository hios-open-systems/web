import { setRequestLocale } from 'next-intl/server';
import { RecommendedSoftwareCatalog } from '@/components/tools/RecommendedSoftwareCatalog';


interface PageProps {
  params: Promise<{ locale: string }>;
}

// Fully static: prerenderizada por locale y servida del static-assets cache
// (open-next.config.ts). Evita el re-render SSR de antd en cada isolate frío.
export const dynamic = 'force-static';
export default async function ToolsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <RecommendedSoftwareCatalog />;
}
