import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { createPageMetadata } from '@/lib/seo';
import { CHAPTERS, getChapter } from '@/lib/radio/chapters';
import { ChapterView } from '@/components/radio/ChapterView';

// Fully static: un HTML por locale × capítulo, sin SSR en el Worker.
export const dynamic = 'force-static';
export const dynamicParams = false;

const locales = ['en', 'es', 'de', 'it'];
export function generateStaticParams() {
  return locales.flatMap((locale) => CHAPTERS.map((c) => ({ locale, chapter: c.slug })));
}

interface PageProps {
  params: Promise<{ locale: string; chapter: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { locale, chapter } = await params;
  const c = getChapter(chapter);
  if (!c) return {};
  return createPageMetadata(locale, `/radio/${c.slug}`, `${c.title} · Radioaficionado | HIOS`, c.summary);
}

export default async function RadioChapterPage({ params }: PageProps) {
  const { locale, chapter } = await params;
  setRequestLocale(locale);
  const c = getChapter(chapter);
  if (!c) notFound();
  return <ChapterView chapter={c} locale={locale} />;
}
