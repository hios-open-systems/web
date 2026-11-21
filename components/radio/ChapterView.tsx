import Link from 'next/link';
import { PageIntro } from '@/components/ui/PageIntro';
import { chapterNeighbors, type Chapter } from '@/lib/radio/chapters';
import { CHAPTER_BODIES } from './chapterBodies';
import { SpanishOnlyNotice } from './SpanishOnlyNotice';
import styles from './radio.module.css';

export function ChapterView({ chapter, locale }: { chapter: Chapter; locale: string }) {
  const { prev, next } = chapterNeighbors(chapter.slug);
  const base = `/${locale}/radio`;
  const index = `${base}/programa`;
  const parts = CHAPTER_BODIES[chapter.slug] ?? [];
  return (
    <main className={styles.page} lang="es">
      <PageIntro
        eyebrow={<Link href={index} style={{ color: 'inherit' }}>Radioaficionado · Novicio</Link>}
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
            {prev ? <Link href={`${base}/${prev.slug}`}>← {prev.title}</Link> : <Link href={index}>← Índice</Link>}
            {next ? <Link href={`${base}/${next.slug}`}>{next.title} →</Link> : <Link href={index}>Índice →</Link>}
          </nav>
        </div>
      </div>
    </main>
  );
}
