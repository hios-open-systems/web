'use client';

import Link from 'next/link';
import { ArrowRightOutlined } from '@ant-design/icons';
import { useLocale, useTranslations } from 'next-intl';
import { projects } from '@/config/projects';
import { ProjectCard } from '@/components/projects/ProjectCard';
import styles from './landing.module.css';

const ordered = [...projects].sort((a, b) => Number(b.slug === 'pad') - Number(a.slug === 'pad'));

export function ProjectsGrid() {
  const t = useTranslations('Projects');
  const lab = useTranslations('Landing');
  const locale = useLocale();
  return (
    <section className={styles.projectsSection} id="projects">
      <div className={styles.projectContainer}>
        <header className={styles.sectionHeader}>
          <div>
            <span className={styles.kicker}>02 / HARDWARE</span>
            <h2>{lab('projectsTitle')}</h2>
          </div>
          <p>{lab('projectsSubtitle')}</p>
        </header>
        <div className={styles.projectGrid}>
          {ordered.map((project, i) => (
            <ProjectCard key={project.slug} project={project} index={i} />
          ))}
        </div>
        <Link className={styles.externalLink} href={`/${locale}/projects`}>
          {t('view_all')} <ArrowRightOutlined />
        </Link>
      </div>
    </section>
  );
}
