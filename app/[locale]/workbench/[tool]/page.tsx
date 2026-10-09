import { getTranslatedMetadata } from '@/lib/seo-metadata';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { ToolRenderer } from '@/components/workbench/ToolRenderer';
import { ToolPager } from '@/components/workbench/ToolPager';
import { ToolUsageTracker } from '@/components/workbench/ToolUsageTracker';
import { ToolPageIntro } from '@/components/workbench/ToolPageIntro';
import { getWorkbenchTool, workbenchTools, type WorkbenchToolId } from '@/config/workbench';

const dynamicToolIds = workbenchTools
  .filter((tool) => !tool.external && !['payload', 'snippets', 'chiptune'].includes(tool.id))
  .map((tool) => tool.id);

interface PageProps {
  params: Promise<{ locale: string; tool: string }>;
}

export const dynamic = 'force-static';
export function generateStaticParams() {
  return dynamicToolIds.map((tool) => ({ tool }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, tool } = await params;
  if (!dynamicToolIds.some((id) => id === tool)) notFound();
  return getTranslatedMetadata(locale, `/workbench/${encodeURIComponent(tool)}`, `Workbench.packs.${tool}`);
}


export default async function DynamicWorkbenchToolPage({ params }: PageProps) {
  const { locale, tool } = await params;
  setRequestLocale(locale);

  const workbenchTool = getWorkbenchTool(tool as WorkbenchToolId);
  if (!workbenchTool || workbenchTool.external || tool === 'payload' || tool === 'snippets') {
    notFound();
  }

  return (
    <main style={{ maxWidth: 1440, margin: '0 auto', padding: '32px 24px 56px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <ToolUsageTracker toolId={workbenchTool.id} />
      <ToolPageIntro locale={locale} tool={workbenchTool} />
      <ToolRenderer toolId={workbenchTool.id} headerRendered />
      <ToolPager currentId={workbenchTool.id} />
    </main>
  );
}
