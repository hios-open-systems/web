'use client';

import { useTranslations } from 'next-intl';
import { CircuitLab } from './CircuitLab';
import { ConceptsSection, OhmSection } from './TheorySections';
import { ConnectionsSection } from './ConnectionsSection';
import { PowerSection } from './PowerSection';
import { PracticeSection } from './PracticeSection';
import { CourseRoadmap, LessonSources } from './LessonResources';
import styles from './radioBasics.module.css';

const chapters = ['concepts', 'ohm', 'connections', 'laboratory', 'power', 'practice'] as const;

function LessonNavigation() {
  const t = useTranslations('RadioBasics');
  return (
    <aside className={styles.sidebar}>
      <span className={styles.eyebrow}>{t('badge')}</span>
      <nav aria-label={t('navLabel')} className={styles.navigation}>
        {chapters.map((chapter) => <a key={chapter} href={`#${chapter}`}>{t(`nav.${chapter}`)}</a>)}
      </nav>
    </aside>
  );
}

function LaboratorySection() {
  const t = useTranslations('RadioBasics');
  return (
    <section id="laboratory" className={styles.section} aria-labelledby="laboratory-title">
      <span className={styles.eyebrow}>{t('nav.laboratory')}</span>
      <h2 id="laboratory-title">{t('experiments.title')}</h2>
      <p>{t('experiments.intro')}</p>
      <CircuitLab />
      <ol className={styles.experiments}>
        {(['one', 'two', 'three'] as const).map((key) => <li key={key}>{t(`experiments.${key}`)}</li>)}
      </ol>
    </section>
  );
}

export function RadioBasicsTool() {
  const t = useTranslations('RadioBasics');
  return (
    <article className={styles.lesson}>
      <LessonNavigation />
      <div className={styles.content}>
        <header className={styles.welcome}>
          <span className={styles.eyebrow}>{t('badge')}</span>
          <h2>{t('introTitle')}</h2>
          <p className={styles.lead}>{t('intro')}</p>
          <p className={styles.scope}>{t('scope')}</p>
        </header>
        <ConceptsSection />
        <OhmSection />
        <ConnectionsSection />
        <LaboratorySection />
        <PowerSection />
        <PracticeSection />
        <CourseRoadmap />
        <LessonSources />
      </div>
    </article>
  );
}
