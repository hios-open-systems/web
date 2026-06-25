'use client';

import React from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useTheme } from '@/lib/ThemeContext';
import type { Post } from '@/lib/blog';

export function BlogPost({ post, locale }: { post: Post; locale: string }) {
    const { mode } = useTheme();
    const textColor = mode === 'dark' ? '#e6e6e6' : '#1a1a1a';
    const secondary = mode === 'dark' ? '#999' : '#666';
    const muted = mode === 'dark' ? '#666' : '#999';
    const cardBorder = mode === 'dark' ? '1px solid #1f1f1f' : '1px solid #f0f0f0';
    const accent = '#f59e0b';

    return (
        <main style={{ background: mode === 'dark' ? '#0d0d0d' : '#fff', minHeight: '100vh', paddingBottom: 80 }}>
            <nav style={{ maxWidth: 760, margin: '0 auto', padding: 24 }}>
                <Link href={`/${locale}/blog`} style={{ color: secondary, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <ArrowLeftOutlined /> Devlog
                </Link>
            </nav>
            <article style={{ maxWidth: 760, margin: '0 auto', padding: '0 24px' }}>
                <div style={{ color: muted, fontSize: 13, marginBottom: 8 }}>{post.date}</div>
                <h1 style={{ color: textColor, fontSize: 'clamp(1.8rem, 5vw, 2.6rem)', fontWeight: 700, lineHeight: 1.2, margin: '0 0 16px' }}>{post.title}</h1>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 32 }}>
                    {post.tags.map((t) => (
                        <span key={t} style={{ color: accent, fontSize: 12, border: cardBorder, borderRadius: 6, padding: '2px 8px' }}>{t}</span>
                    ))}
                </div>
                <div className="markdown-content" style={{ color: textColor }}>
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                            h2: ({ children }) => <h2 style={{ color: textColor, fontSize: 22, fontWeight: 600, marginTop: 36, marginBottom: 14 }}>{children}</h2>,
                            h3: ({ children }) => <h3 style={{ color: textColor, fontSize: 18, fontWeight: 600, marginTop: 24, marginBottom: 10 }}>{children}</h3>,
                            p: ({ children }) => <p style={{ color: secondary, fontSize: 16, lineHeight: 1.8, marginBottom: 18 }}>{children}</p>,
                            li: ({ children }) => <li style={{ color: secondary, fontSize: 16, lineHeight: 1.8, marginBottom: 6 }}>{children}</li>,
                            code: ({ children }) => (
                                <code style={{ background: mode === 'dark' ? '#1a1a1a' : '#f5f5f5', color: mode === 'dark' ? '#4096ff' : '#0066cc', padding: '2px 6px', borderRadius: 4, fontSize: '0.9em' }}>
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
