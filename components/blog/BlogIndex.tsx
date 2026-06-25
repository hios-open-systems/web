'use client';

import React from 'react';
import Link from 'next/link';
import { useTheme } from '@/lib/ThemeContext';
import type { PostMeta } from '@/lib/blog';

export function BlogIndex({ posts, locale }: { posts: PostMeta[]; locale: string }) {
    const { mode } = useTheme();
    const textColor = mode === 'dark' ? '#e6e6e6' : '#1a1a1a';
    const secondary = mode === 'dark' ? '#999' : '#666';
    const muted = mode === 'dark' ? '#666' : '#999';
    const cardBg = mode === 'dark' ? '#141414' : '#fafafa';
    const cardBorder = mode === 'dark' ? '1px solid #1f1f1f' : '1px solid #f0f0f0';
    const accent = '#f59e0b';

    return (
        <main style={{ background: mode === 'dark' ? '#0d0d0d' : '#fff', minHeight: '100vh' }}>
            <section style={{ maxWidth: 820, margin: '0 auto', padding: '24px 24px 32px' }}>
                <h1 style={{ color: textColor, fontSize: 'clamp(2rem, 5vw, 2.8rem)', fontWeight: 700, margin: '0 0 12px' }}>Devlog</h1>
                <p style={{ color: secondary, fontSize: 17, maxWidth: 600, lineHeight: 1.6, margin: 0 }}>
                    Notas técnicas de lo que voy construyendo y rompiendo. Sin cronograma — cuando hay algo que contar.
                </p>
            </section>
            <section style={{ maxWidth: 820, margin: '0 auto', padding: '0 24px 60px', display: 'grid', gap: 16 }}>
                {posts.length === 0 ? (
                    <div style={{ color: muted }}>Todavía no hay posts.</div>
                ) : (
                    posts.map((p) => (
                        <Link
                            key={p.slug}
                            href={`/${locale}/blog/${p.slug}`}
                            style={{ display: 'block', padding: '20px 22px', background: cardBg, border: cardBorder, borderRadius: 14, textDecoration: 'none' }}
                        >
                            <div style={{ color: muted, fontSize: 13, marginBottom: 6 }}>{p.date}</div>
                            <h2 style={{ color: textColor, fontSize: 20, fontWeight: 600, margin: '0 0 8px' }}>{p.title}</h2>
                            <p style={{ color: secondary, fontSize: 15, lineHeight: 1.6, margin: '0 0 12px' }}>{p.summary}</p>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                {p.tags.map((t) => (
                                    <span key={t} style={{ color: accent, fontSize: 12, border: cardBorder, borderRadius: 6, padding: '2px 8px' }}>{t}</span>
                                ))}
                            </div>
                        </Link>
                    ))
                )}
            </section>
        </main>
    );
}
