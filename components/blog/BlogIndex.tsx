'use client';

import React from 'react';
import Link from 'next/link';
import type { PostMeta } from '@/lib/blog';
import styles from './blog.module.css';

export function BlogIndex({ posts, locale }: { posts: PostMeta[]; locale: string }) {
    return (
        <main className={styles.page}>
            <section className={styles.hero}>
                <h1 className={styles.title}>Devlog</h1>
                <p className={styles.intro}>
                    Notas técnicas de lo que voy construyendo y rompiendo. Sin cronograma — cuando hay algo que contar.
                </p>
            </section>
            <section className={styles.list}>
                {posts.length === 0 ? (
                    <div className={styles.empty}>Todavía no hay posts.</div>
                ) : (
                    posts.map((p) => (
                        <Link
                            key={p.slug}
                            href={`/${locale}/blog/${p.slug}`}
                            className={styles.card}
                        >
                            <div className={styles.date}>{p.date}</div>
                            <h2 className={styles.cardTitle}>{p.title}</h2>
                            <p className={styles.summary}>{p.summary}</p>
                            <div className={styles.tags}>
                                {p.tags.map((t) => (
                                    <span key={t} className={styles.tag}>{t}</span>
                                ))}
                            </div>
                        </Link>
                    ))
                )}
            </section>
        </main>
    );
}
