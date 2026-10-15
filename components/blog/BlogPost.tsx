'use client';

import React from 'react';
import { PageIntro } from '@/components/ui/PageIntro';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useTranslations } from 'next-intl';
import { ArrowLeftOutlined } from '@ant-design/icons';
import type { Post } from '@/lib/blog';
import { extractH2Toc, nodeToText, slugifyHeading } from './markdownToc';
import styles from './blog.module.css';

export function BlogPost({ post, locale }: { post: Post; locale: string }) {
  const t = useTranslations('Blog');
  const toc = extractH2Toc(post.content);

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
          {post.tags.length > 0 && (
            <div className={styles.tags}>
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
        <div className={`markdown-content ${styles.prose}`}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h2: ({ children }) => <h2 id={slugifyHeading(nodeToText(children))}>{children}</h2>,
              table: ({ children }) => (
                <div className={styles.tableWrap}>
                  <table>{children}</table>
                </div>
              ),
            }}
          >
            {post.content}
          </ReactMarkdown>
        </div>
      </article>
    </main>
  );
}
