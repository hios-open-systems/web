import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { softwareProjects, softwarePath, type SoftwareProjectSlug } from '@/config/project-software';
import { PageTrail } from '@/components/seo/PageTrail';
import { JsonLd } from '@/components/seo/JsonLd';
import { createProjectPageData } from '@/lib/structured-data';
import styles from './project-software.module.css';

export async function ProjectSoftwarePage({ locale, slug }: { locale: string; slug: SoftwareProjectSlug }) {
  const t = await getTranslations({ locale, namespace: `ProjectSoftware.${slug}` });
  const labels = await getTranslations({ locale, namespace: 'ProjectSoftware' });
  const header = await getTranslations({ locale, namespace: 'Header' });
  const project = softwareProjects[slug];
  const path = softwarePath(slug);
  return (
    <main className={styles.page}>
      <PageTrail locale={locale} inContent items={[
        { name: header('home'), path: '' }, { name: header('projects'), path: '/projects' },
        { name: project.name, path: `/projects/${slug}` }, { name: labels('label'), path },
      ]} />
      <JsonLd data={createProjectPageData(locale, path, t('title'), t('description'))} />
      <header className={styles.hero}>
        <p className={styles.eyebrow}>{project.name} / {labels('label')}</p>
        <h1>{t('title')}</h1>
        <p className={styles.lead}>{t('description')}</p>
        <nav className={styles.links} aria-label={labels('sections')}>
          {project.sections.map((section) => <a key={section} href={`#${section}`}>{t(`${section}.title`)}</a>)}
        </nav>
      </header>
      <div className={styles.grid}>
        {project.sections.map((section, index) => (
          <section className={styles.card} id={section} key={section}>
            <span className={styles.eyebrow} aria-hidden="true">0{index + 1}</span>
            <h2>{t(`${section}.title`)}</h2>
            <p>{t(`${section}.body`)}</p>
          </section>
        ))}
      </div>
      <footer className={styles.footer}>
        <h2>{labels('source')}</h2>
        <div className={styles.links}>
          {project.sources.map((source) => (
            <a key={source.path} href={`https://github.com/hios-open-systems/web/tree/main/projects/${source.path}`}>
              {source.label} ↗
            </a>
          ))}
          <Link href={`/${locale}/projects/${slug}`}>{labels('hardware')} →</Link>
          <Link href={`/${locale}/pinouts/${slug}`}>{labels('wiring')} →</Link>
        </div>
      </footer>
    </main>
  );
}
