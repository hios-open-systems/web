'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { radioLessons, radioPagePath, radioCoursePath, type RadioPageId } from '@/config/radio-course';
import { RadioCourseNavigation } from './RadioCourseNavigation';
import lessonStyles from './radioBasics.module.css';
import styles from './radioCourse.module.css';

function CoursePager({ page }: { page: RadioPageId }) {
  const t = useTranslations('RadioCourse');
  const locale = useLocale();
  const index = radioLessons.findIndex((lesson) => lesson.id === page);
  if (index < 0) return <nav className={styles.pager} aria-label={t('backToCourse')}><Link href={`/${locale}${radioCoursePath}`}>{t('backToCourse')}</Link></nav>;
  const links = [
    { page: radioLessons[index - 1], label: 'previous' },
    { page: radioLessons[index + 1], label: 'next' },
  ];
  return (
    <nav className={styles.pager} aria-label={t('navigation')}>
      {links.map((link) => link.page ? <Link key={link.label} data-direction={link.label} href={`/${locale}${radioPagePath(link.page.id)}`}>
        <span>{t(link.label)}</span><strong>{t(`pages.${link.page.id}.title`)}</strong>
      </Link> : null)}
    </nav>
  );
}

export function RadioCourseShell({ page, children }: { page: RadioPageId; children: ReactNode }) {
  const t = useTranslations('RadioCourse');
  const index = radioLessons.findIndex((lesson) => lesson.id === page);
  return (
    <div className={styles.shell} data-wide={['laboratory', 'glossary', 'bands'].includes(page)} data-radio-page={page}>
      <RadioCourseNavigation page={page} />
      <article className={`${styles.reading} ${lessonStyles.content}`}>
        <header className={styles.pageHeader}>
          <span className={styles.position}>{index >= 0 ? t('lessonPosition', { current: index + 1, total: radioLessons.length }) : t('resource')}</span>
          <h1 id="radio-page-title">{t(`pages.${page}.title`)}</h1>
          <p>{t(`pages.${page}.description`)}</p>
        </header>
        <div className={styles.lessonBody} data-radio-lesson>{children}</div>
        <CoursePager page={page} />
      </article>
    </div>
  );
}
