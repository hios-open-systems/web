import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { translatedMetadata } from '@/lib/seo-metadata';
import { getWorkbenchTool } from '@/config/workbench';
import { ToolPageIntro } from '@/components/workbench/ToolPageIntro';
import { ToolRenderer } from '@/components/workbench/ToolRenderer';
import { ToolUsageTracker } from '@/components/workbench/ToolUsageTracker';

export const dynamic = 'force-static';
export const generateMetadata = translatedMetadata('/workbench/radio-basics', 'Workbench.packs.radio-basics');

export default async function RadioCourseHome({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tool = getWorkbenchTool('radio-basics');
  if (!tool) notFound();
  return (
    <main style={{ maxWidth: 1460, width: '100%', margin: '0 auto', padding: '28px 24px 56px' }}>
      <ToolUsageTracker toolId="radio-basics" />
      <ToolPageIntro locale={locale} tool={tool} />
      <ToolRenderer toolId="radio-basics" headerRendered />
    </main>
  );
}
