import { translatedMetadata } from '@/lib/seo-metadata';
import { setRequestLocale } from 'next-intl/server';
import { SnippetsWorkspace } from '@/components/workbench/SnippetsWorkspace';
import { ToolPager } from '@/components/workbench/ToolPager';
import { ToolUsageTracker } from '@/components/workbench/ToolUsageTracker';

export const generateMetadata = translatedMetadata('/workbench/snippets', 'Workbench.packs.snippets', 'description');


interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function WorkbenchSnippetsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main style={{ maxWidth: 1180, margin: '0 auto', padding: '32px 24px 56px' }}>
      <ToolUsageTracker toolId="snippets" />
      <SnippetsWorkspace />
      <ToolPager currentId="snippets" />
    </main>
  );
}