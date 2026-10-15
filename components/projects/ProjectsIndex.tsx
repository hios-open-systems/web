'use client';

import { useTranslations } from 'next-intl';
import { projects } from '@/config/projects';
import { ProjectCard } from './ProjectCard';
import { PageIntro } from '@/components/ui/PageIntro';
import styles from './projectsIndex.module.css';

export function ProjectsIndex() {
  const t = useTranslations('ProjectsPage');
  const ordered = [...projects].sort((a, b) => Number(b.slug === 'pad') - Number(a.slug === 'pad'));
  return (
    <main className={styles.page}>
      <PageIntro eyebrow="HIOS / HARDWARE" title={t('title')} description={t('subtitle')} area="maker" />
      <div className={styles.grid}>
        {ordered.map((project, index) => (
          <ProjectCard key={project.slug} project={project} index={index} details />
        ))}
      </div>
    </main>
  );
}
