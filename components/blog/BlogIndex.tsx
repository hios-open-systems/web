'use client';

import React from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import type { PostMeta } from '@/lib/blog';
import styles from './blog.module.css';

const STRINGS = {
    en: {
        kicker: 'HIOS / Docs',
        title: 'Documentation',
        intro: 'Technical reference docs and a build log. Reference docs are living documents; devlog entries are dated field notes.',
        refKicker: '01 / Technical reference',
        devKicker: '02 / Devlog',
        empty: 'Nothing here yet.',
    },
    es: {
        kicker: 'HIOS / Docs',
        title: 'Documentación',
        intro: 'Documentos de referencia técnica y bitácora de construcción. La referencia son documentos vivos; el devlog, notas de campo con fecha.',
        refKicker: '01 / Referencia técnica',
        devKicker: '02 / Devlog',
        empty: 'Todavía no hay nada acá.',
    },
} as const;

/** Números de documento estables: se asignan por orden cronológico ascendente
 *  dentro de cada categoría (el doc más viejo es 001), así no cambian al publicar. */
function buildDocCodes(posts: PostMeta[]): Map<string, string> {
    const asc = [...posts].sort((a, b) =>
        a.date === b.date ? a.slug.localeCompare(b.slug) : a.date < b.date ? -1 : 1,
    );
    const counters: Record<string, number> = {};
    const codes = new Map<string, string>();
    for (const p of asc) {
        const prefix = p.category === 'referencia' ? 'REF' : 'LOG';
        counters[prefix] = (counters[prefix] ?? 0) + 1;
        codes.set(p.slug, `${prefix}-${String(counters[prefix]).padStart(3, '0')}`);
    }
    return codes;
}

function DocRow({ post, code, locale }: { post: PostMeta; code: string; locale: string }) {
    return (
        <Link href={`/${locale}/blog/${post.slug}`} prefetch={false} className={styles.row}>
            <span className={styles.rowCode}>{code}</span>
            <span className={styles.rowMain}>
                <span className={styles.rowTitle}>{post.title}</span>
                {post.summary ? <span className={styles.rowSummary}>{post.summary}</span> : null}
                {post.tags.length > 0 ? (
                    <span className={styles.tags}>
                        {post.tags.map((t) => (
                            <span key={t} className={styles.tag}>{t}</span>
                        ))}
                    </span>
                ) : null}
            </span>
            <span className={styles.rowDate}>{post.date}</span>
        </Link>
    );
}

export function BlogIndex({ posts, locale }: { posts: PostMeta[]; locale: string }) {
    const activeLocale = useLocale();
    const t = STRINGS[activeLocale === 'es' ? 'es' : 'en'];
    const codes = buildDocCodes(posts);
    const referencia = posts.filter((p) => p.category === 'referencia');
    const devlog = posts.filter((p) => p.category !== 'referencia');

    const sections = [
        { key: 'referencia', kicker: t.refKicker, items: referencia },
        { key: 'devlog', kicker: t.devKicker, items: devlog },
    ].filter((s) => s.items.length > 0);

    return (
        <main className={styles.page}>
            <section className={styles.hero}>
                <div className={styles.kicker}>{t.kicker}</div>
                <h1 className={styles.title}>{t.title}</h1>
                <p className={styles.intro}>{t.intro}</p>
            </section>
            {sections.length === 0 ? (
                <section className={styles.list}>
                    <div className={styles.empty}>{t.empty}</div>
                </section>
            ) : (
                sections.map((section) => (
                    <section key={section.key} className={styles.list}>
                        <div className={styles.sectionKicker}>{section.kicker}</div>
                        <div className={styles.sectionList}>
                            {section.items.map((p) => (
                                <DocRow key={p.slug} post={p} code={codes.get(p.slug) ?? ''} locale={locale} />
                            ))}
                        </div>
                    </section>
                ))
            )}
        </main>
    );
}
