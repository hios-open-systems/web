'use client';

import React from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useLocale } from 'next-intl';
import { ArrowLeftOutlined } from '@ant-design/icons';
import type { Post } from '@/lib/blog';
import { extractH2Toc, nodeToText, slugifyHeading } from './markdownToc';
import styles from './blog.module.css';

const STRINGS = {
    en: {
        back: 'Docs',
        toc: 'In this doc',
        category: { devlog: 'Devlog', referencia: 'Technical reference' },
    },
    es: {
        back: 'Docs',
        toc: 'En este doc',
        category: { devlog: 'Devlog', referencia: 'Referencia técnica' },
    },
} as const;

export function BlogPost({ post, locale }: { post: Post; locale: string }) {
    const activeLocale = useLocale();
    const t = STRINGS[activeLocale === 'es' ? 'es' : 'en'];
    const toc = extractH2Toc(post.content);

    return (
        <main className={styles.page}>
            <nav className={styles.backNav}>
                <Link href={`/${locale}/blog`} className={styles.backLink}>
                    <ArrowLeftOutlined /> {t.back}
                </Link>
            </nav>
            <article className={styles.article}>
                <header className={styles.articleHeader}>
                    <div className={styles.kicker}>
                        <span className={styles.kickerCategory}>{t.category[post.category]}</span>
                        <span className={styles.kickerSep} aria-hidden="true">/</span>
                        <span>{post.date}</span>
                    </div>
                    <h1 className={styles.articleTitle}>{post.title}</h1>
                    {post.tags.length > 0 ? (
                        <div className={styles.tags}>
                            {post.tags.map((tag) => (
                                <span key={tag} className={styles.tag}>{tag}</span>
                            ))}
                        </div>
                    ) : null}
                </header>
                {toc.length >= 2 ? (
                    <nav className={styles.toc} aria-label={t.toc}>
                        <div className={styles.tocTitle}>{t.toc}</div>
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
                            h2: ({ children }) => (
                                <h2 id={slugifyHeading(nodeToText(children))}>{children}</h2>
                            ),
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
