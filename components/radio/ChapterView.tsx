import Link from 'next/link';
import type { ComponentType } from 'react';
import { PageIntro } from '@/components/ui/PageIntro';
import { chapterNeighbors, type Chapter } from '@/lib/radio/chapters';
import { ChapterA } from './chapters/ChapterA';
import { ChapterA2 } from './chapters/ChapterA2';
import { ChapterB } from './chapters/ChapterB';
import { ChapterC } from './chapters/ChapterC';
import { ChapterD } from './chapters/ChapterD';
import { ChapterMorse } from './chapters/ChapterMorse';
import { ChapterPractice } from './chapters/ChapterPractice';
import { SpanishOnlyNotice } from './SpanishOnlyNotice';
import styles from './radio.module.css';

const BODIES: Record<string, ComponentType[]> = {
  'a-electricidad': [ChapterA, ChapterA2],
  'b-modulacion-equipos': [ChapterB],
  'c-antenas-propagacion': [ChapterC],
  'd-reglamento': [ChapterD],
  morse: [ChapterMorse],
  practica: [ChapterPractice],
};

export function ChapterView({ chapter, locale }: { chapter: Chapter; locale: string }) {
  const { prev, next } = chapterNeighbors(chapter.slug);
  const base = `/${locale}/radio`;
  const parts = BODIES[chapter.slug] ?? [];
  return (
    <main className={styles.page} lang="es">
      <PageIntro
        eyebrow={<Link href={base} style={{ color: 'inherit' }}>Radioaficionado · Novicio</Link>}
        title={`${chapter.code.length === 1 ? `Bloque ${chapter.code}: ` : ''}${chapter.title}`}
        description={chapter.summary}
        area="knowledge"
        compact
      />
      {locale !== 'es' ? <SpanishOnlyNotice /> : null}
      <div className={styles.layout} style={{ marginTop: 32 }}>
        <nav className={styles.toc} aria-label="En este capítulo">
          <p className={styles.tocTitle}>En este capítulo</p>
          <ol>{chapter.sections.map((s) => <li key={s.id}><a href={`#${s.id}`}>{s.title}</a></li>)}</ol>
        </nav>
        <div className={styles.content}>
          {parts.map((Part, i) => <Part key={i} />)}
          <nav className={styles.pager} aria-label="Capítulos">
            {prev ? <Link href={`${base}/${prev.slug}`}>← {prev.title}</Link> : <Link href={base}>← Índice</Link>}
            {next ? <Link href={`${base}/${next.slug}`}>{next.title} →</Link> : <Link href={base}>Índice →</Link>}
          </nav>
        </div>
      </div>
    </main>
  );
}
