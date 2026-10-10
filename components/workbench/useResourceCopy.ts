'use client';
import { useLocale, useTranslations } from 'next-intl';
import posts from '@/lib/blogLocalizedManifest.json';
import { resources } from '@/lib/workspaces/resources';

export function useResourceCopy() {
  const locale = useLocale();
  const t = useTranslations('Workspace');
  const packs = useTranslations('Workbench.packs');
  const articles = posts[locale as keyof typeof posts] ?? posts.en;
  const article = (id: string) => id.startsWith('article:') ? articles.find(post => post.slug === id.slice(8)) : undefined;
  const key = (id: string) => id.replaceAll(':', '-');
  function label(id: string) {
    if (id.startsWith('tool:')) return packs(`${id.slice(5)}.title`);
    if (t.has(`resourceLabels.${key(id)}`)) return t(`resourceLabels.${key(id)}`);
    return article(id)?.title ?? resources.find(resource => resource.id === id)?.label ?? id;
  }
  function description(id: string) {
    if (id.startsWith('tool:')) return packs(`${id.slice(5)}.description`);
    if (t.has(`resourceDescriptions.${key(id)}`)) return t(`resourceDescriptions.${key(id)}`);
    return article(id)?.summary;
  }
  return { label, description };
}
