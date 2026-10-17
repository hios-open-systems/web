'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { PageIntro } from '@/components/ui/PageIntro';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { LocalMarkdownImage } from '@/components/common/LocalMarkdownImage';
import remarkGfm from 'remark-gfm';
import { useTranslations } from 'next-intl';
import { ArrowLeftOutlined } from '@ant-design/icons';
import type { Post } from '@/lib/blog';
import { extractH2Toc, nodeToText, slugifyHeading } from './markdownToc';
import styles from './blog.module.css';

const QpskSimulator = dynamic(
  () => import('@/components/dsp/QpskSimulator').then((m) => m.QpskSimulator),
  { ssr: false },
);

const QPSK_MARKER = '<!-- interactive:qpsk-simulator -->';

function MarkdownSection({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        img: LocalMarkdownImage,
        h2: ({ children }) => <h2 id={slugifyHeading(nodeToText(children))}>{children}</h2>,
        table: ({ children }) => (
          <div className={styles.tableWrap}>
            <table>{children}</table>
          </div>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

export function BlogPost({ post, locale }: { post: Post; locale: string }) {
  const t = useTranslations('Blog');
  const toc = extractH2Toc(post.content);
  const hasMarker = post.content.includes(QPSK_MARKER);
  const segments = hasMarker ? post.content.split(QPSK_MARKER) : [post.content];

  return (
    <main className={styles.page}>
      <nav className={styles.backNav}>
        <Link href={`/${locale}/blog`} className={styles.backLink}>
          <ArrowLeftOutlined /> {t('back')}
        </Link>
      </nav>
      <article className={styles.article} lang={post.lang}>
        <PageIntro
          eyebrow={t('category.' + post.category)}
          title={post.title}
          area="knowledge"
          compact
          meta={<span>{post.date}</span>}
        >
          {(post.tags.length > 0 || post.interactive) && (
            <div className={styles.tags}>
              {post.interactive ? (
                <span className={styles.interactiveBadge}>LAB INTERACTIVO</span>
              ) : null}
              {post.tags.map((tag) => (
                <span key={tag} className={styles.tag}>
                  {tag}
                </span>
              ))}
            </div>
          )}
        </PageIntro>
        {toc.length >= 2 ? (
          <nav className={styles.toc} aria-label={t('toc')}>
            <div className={styles.tocTitle}>{t('toc')}</div>
            <ol className={styles.tocList}>
              {toc.map((entry, i) => (
                <li key={entry.id}>
                  <a href={`#${entry.id}`} className={styles.tocLink}>
                    <span className={styles.tocNum}>{String(i + 1).padStart(2, '0')}</span>
                    {entry.text}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        ) : null}
        {post.interactive === 'qpsk-simulator' && !hasMarker ? (
          <div className={styles.interactiveBreakout}>
            <QpskSimulator />
          </div>
        ) : null}
        <div className={`markdown-content ${styles.prose}`}>
          {segments.map((segment, idx) => (
            <React.Fragment key={idx}>
              <MarkdownSection content={segment} />
              {idx < segments.length - 1 ? (
                <div className={styles.interactiveBreakout}>
                  <QpskSimulator />
                </div>
              ) : null}
            </React.Fragment>
          ))}
        </div>
      </article>
    </main>
  );
}
