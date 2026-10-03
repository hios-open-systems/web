import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { isSoftwareProject, softwareProjects, softwarePath } from '@/config/project-software';
import { createPageMetadata } from '@/lib/seo';
import { ProjectSoftwarePage } from '@/components/projects/ProjectSoftwarePage';

export const dynamic = 'force-static';
type Props = { params: Promise<{ locale: string; slug: string }> };

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => Object.keys(softwareProjects).map((slug) => ({ locale, slug })));
}

export async function generateMetadata({ params }: Props) {
  const { locale, slug } = await params;
  if (!isSoftwareProject(slug)) notFound();
  const t = await getTranslations({ locale, namespace: `ProjectSoftware.${slug}` });
  return createPageMetadata(locale, softwarePath(slug), `${t('title')} | HIOS`, t('description'));
}

export default async function SoftwarePage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  if (!isSoftwareProject(slug)) notFound();
  return <ProjectSoftwarePage locale={locale} slug={slug} />;
}
