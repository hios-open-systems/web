import { getTranslations } from 'next-intl/server';
import type { WorkbenchTool } from '@/config/workbench';
import { workbenchGuideIds } from '@/config/workbench-guides';
import { ToolHeader } from './ToolHeader';

/** Prerender useful copy while browser-only APIs remain in the client tool. */
export async function ToolPageIntro({ locale, tool }: { locale: string; tool: WorkbenchTool }) {
  const t = await getTranslations({ locale, namespace: 'Workbench' });
  return (
    <ToolHeader
      eyebrow={t(`sections.${tool.sectionId}.title`)}
      title={t(`packs.${tool.id}.title`)}
      description={t(`packs.${tool.id}.description`)}
      locality={tool.locality}
      guideId={workbenchGuideIds[tool.id]}
    />
  );
}
