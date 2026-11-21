import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getTranslatedMetadata } from '@/lib/seo-metadata';
import { radioPages, isRadioPageId, radioPagePath, radioCoursePath } from '@/config/radio-course';
import { PageTrail } from '@/components/seo/PageTrail';
import { RadioCourseShell } from '@/components/radio-basics/RadioCourseShell';
import { RadioLessonContent } from '@/components/radio-basics/RadioLessonContent';
import styles from '@/components/radio-basics/radioCourse.module.css';

interface Props { params: Promise<{ locale: string; chapter: string }> }

export const dynamic = 'force-static';
export const dynamicParams = false;
export function generateStaticParams() {
  return radioPages.map(({ id }) => ({ chapter: id }));
}

export async function generateMetadata({ params }: Props) {
  const { locale, chapter } = await params;
  if (!isRadioPageId(chapter)) notFound();
  return getTranslatedMetadata(locale, radioPagePath(chapter), `RadioCourse.pages.${chapter}`);
}

export default async function RadioCourseLesson({ params }: Props) {
  const { locale, chapter } = await params;
  if (!isRadioPageId(chapter)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'RadioCourse' });
  const title = t(`pages.${chapter}.title`);
  return (
    <main className={styles.page}>
      <PageTrail locale={locale} inContent items={[
        { name: 'HIOS', path: '' },
        { name: t('backToCourse'), path: radioCoursePath },
        { name: title, path: radioPagePath(chapter) },
      ]} />
      <RadioCourseShell page={chapter}><RadioLessonContent page={chapter} /></RadioCourseShell>
    </main>
  );
}
