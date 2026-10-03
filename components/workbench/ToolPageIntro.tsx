import { getTranslations } from 'next-intl/server';
import type { WorkbenchTool } from '@/config/workbench';
import { workbenchGuideIds } from '@/config/workbench-guides';
import { ToolHeader } from './ToolHeader';
import { PageTrail } from '@/components/seo/PageTrail';
import { JsonLd } from '@/components/seo/JsonLd';
import { createWebApplicationData } from '@/lib/structured-data';

/** Prerender useful copy while browser-only APIs remain in the client tool. */
export async function ToolPageIntro({ locale, tool }: { locale: string; tool: WorkbenchTool }) {
  const t = await getTranslations({ locale, namespace: 'Workbench' });
  const header = await getTranslations({ locale, namespace: 'Header' });
  const title = t(`packs.${tool.id}.title`);
  const description = t(`packs.${tool.id}.description`);
  return (
    <>
    <PageTrail locale={locale} inContent items={[
      { name: header('home'), path: '' },
      { name: t('landing.title'), path: '/workbench' },
      { name: title, path: tool.href as `/workbench/${string}` },
    ]} />
    <JsonLd data={createWebApplicationData(locale, tool.href as `/workbench/${string}`, title, description)} />
    <ToolHeader
      eyebrow={t(`sections.${tool.sectionId}.title`)}
      title={title}
      description={description}
      locality={tool.locality}
      guideId={workbenchGuideIds[tool.id]}
    />
    </>
  );
}
