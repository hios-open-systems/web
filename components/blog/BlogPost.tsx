'use client';

import React from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowLeftOutlined } from '@ant-design/icons';
import type { Post } from '@/lib/blog';
import styles from './blog.module.css';

export function BlogPost({ post, locale }: { post: Post; locale: string }) {
    return (
        <main className={styles.page}>
            <nav className={styles.backNav}>
                <Link href={`/${locale}/blog`} className={styles.backLink}>
                    <ArrowLeftOutlined /> Devlog
                </Link>
            </nav>
            <article className={styles.article}>
                <div className={styles.date}>{post.date}</div>
                <h1 className={`${styles.title} ${styles.articleTitle}`}>{post.title}</h1>
                <div className={`${styles.tags} ${styles.articleTags}`}>
                    {post.tags.map((t) => (
                        <span key={t} className={styles.tag}>{t}</span>
                    ))}
                </div>
                <div className={`markdown-content ${styles.prose}`}>
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                            code: ({ children }) => (
                                <code style={{ background: 'var(--hios-bg-secondary)', color: 'var(--accent-text)', padding: '2px 6px', borderRadius: 4, fontSize: '0.9em' }}>
                                    {children}
                                </code>
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
