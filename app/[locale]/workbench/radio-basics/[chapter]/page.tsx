import { notFound, permanentRedirect } from 'next/navigation';
import { isRadioPageId, radioPages, radioPagePath } from '@/config/radio-course';

export const dynamic = 'force-static';
export const dynamicParams = false;
export function generateStaticParams() {
  return radioPages.map(({ id }) => ({ chapter: id }));
}

export default async function LegacyRadioLesson({ params }: { params: Promise<{ locale: string; chapter: string }> }) {
  const { locale, chapter } = await params;
  if (!isRadioPageId(chapter)) notFound();
  permanentRedirect(`/${locale}${radioPagePath(chapter)}`);
}
