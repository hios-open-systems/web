'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Select } from 'antd';
import { useLocale, useTranslations } from 'next-intl';
import { radioLessons, radioResources, radioPagePath, radioCoursePath, type RadioPageId } from '@/config/radio-course';
import styles from './radioCourse.module.css';

export function RadioCourseNavigation({ page }: { page: RadioPageId }) {
  const t = useTranslations('RadioCourse');
  const locale = useLocale();
  const router = useRouter();
  const groups = [{ label: 'lessonsLabel', pages: radioLessons }, { label: 'resourcesLabel', pages: radioResources }] as const;
  return (
    <aside className={styles.sidebar}>
      <div className={styles.desktopNavigation}>
        <Link href={`/${locale}${radioCoursePath}`}>{t('backToCourse')}</Link>
        <nav aria-label={t('navigation')}>
          {groups.map((group) => <div key={group.label}>
            <p className={styles.navGroup}>{t(group.label)}</p>
            {group.pages.map(({ id }) => <Link key={id} href={`/${locale}${radioPagePath(id)}`} aria-current={page === id ? 'page' : undefined}>
              {t(`pages.${id}.title`)}
            </Link>)}
          </div>)}
        </nav>
      </div>
      <div className={styles.mobileNavigation}>
        <label htmlFor="radio-course-topic">{t('jump')}</label>
        <Select id="radio-course-topic" value={page} aria-label={t('jump')}
          onChange={(id: RadioPageId | '') => router.push(`/${locale}${id ? radioPagePath(id) : radioCoursePath}`)}
          options={[
            { value: '', label: t('backToCourse') },
            ...groups.map((group) => ({ label: t(group.label), options: group.pages.map(({ id }) => ({ value: id, label: t(`pages.${id}.title`) })) })),
          ]} />
      </div>
    </aside>
  );
}
