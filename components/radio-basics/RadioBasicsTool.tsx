'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from 'antd';
import { useLocale, useTranslations } from 'next-intl';
import { radioLessons, radioResources, radioPagePath, radioCoursePath, type RadioPageId } from '@/config/radio-course';
import styles from './radioCourse.module.css';

const oldSections: Record<string, RadioPageId> = {
  concepts: 'voltage', ohm: 'ohm', connections: 'series', laboratory: 'laboratory',
  power: 'power', practice: 'practice', glossary: 'glossary',
};

function useLegacyCourseLinks() {
  const locale = useLocale();
  const router = useRouter();
  useEffect(() => {
    const page = oldSections[window.location.hash.slice(1)];
    if (page) router.replace('/' + locale + radioPagePath(page));
  }, [locale, router]);
}

export function RadioBasicsTool() {
  const t = useTranslations('RadioCourse');
  const locale = useLocale();
  const router = useRouter();
  useLegacyCourseLinks();
  return (
    <div className={styles.home} data-testid="radio-course-home">
      <div className={styles.homeIntro}>
        <h2>{t('hubTitle')}</h2>
        <p>{t('hubIntro')}</p>
        <Button type="primary" size="large" onClick={() => router.push('/' + locale + radioPagePath('voltage'))}>{t('start')}</Button>
      </div>
      <section aria-labelledby="radio-lessons-title">
        <h2 id="radio-lessons-title">{t('lessonsLabel')}</h2>
        <ol className={styles.lessonList} data-testid="radio-lesson-list">
          {radioLessons.map(({ id }) => (
            <li key={id}><Link href={'/' + locale + radioPagePath(id)}>
              <h3>{t('pages.' + id + '.title')}</h3><p>{t('pages.' + id + '.description')}</p>
            </Link></li>
          ))}
        </ol>
      </section>
      <section aria-labelledby="radio-resources-title">
        <h2 id="radio-resources-title">{t('resourcesLabel')}</h2>
        <div className={styles.resourceList} data-testid="radio-resource-list">
          {radioResources.map(({ id }) => <Link key={id} href={'/' + locale + radioPagePath(id)}>
            <h3>{t('pages.' + id + '.title')}</h3><p>{t('pages.' + id + '.description')}</p>
          </Link>)}
        </div>
      </section>
      <aside className={styles.future}><h2>{t('futureLabel')}</h2><p>{t('futureIntro')}</p><Link href={`/${locale}${radioCoursePath}/programa`}>{t('programLink')}</Link></aside>
    </div>
  );
}
