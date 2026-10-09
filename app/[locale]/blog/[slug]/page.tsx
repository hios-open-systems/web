import { JsonLd } from '@/components/seo/JsonLd';
import { PageTrail } from '@/components/seo/PageTrail';
import { createArticleData } from '@/lib/structured-data';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { getPostSlugs, getPostBySlug } from '@/lib/blog';
import { BlogPost } from '@/components/blog/BlogPost';
import { createPageMetadata } from '@/lib/seo';
import { RelatedResources } from '@/components/workbench/RelatedResources';

const locales = ['en', 'es', 'de', 'it'];

export const dynamic = 'force-static';
export function generateStaticParams() {
    const slugs = getPostSlugs();
    return locales.flatMap((locale) => slugs.map((slug) => ({ locale, slug })));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
    const { locale, slug } = await params;
    const post = getPostBySlug(slug, locale);
    if (!post) notFound();
    return createPageMetadata(locale, `/blog/${encodeURIComponent(slug)}`, `${post.title} | HIOS`, post.summary);
}

export default async function BlogPostPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
    const { locale, slug } = await params;
    setRequestLocale(locale);
    const post = getPostBySlug(slug, locale);
    if (!post) notFound();
    const header = await getTranslations({ locale, namespace: 'Header' });
    const path = `/blog/${encodeURIComponent(slug)}` as const;
    return <>
        <PageTrail locale={locale} items={[
            { name: header('home'), path: '' }, { name: 'Devlog', path: '/blog' },
            { name: post.title, path },
        ]} />
        <JsonLd data={createArticleData(locale, path, post)} />
        <BlogPost post={post} locale={locale} />
        <RelatedResources resourceId={`article:${slug}`} toolIds={/ia|llm|ollama|tinyml|esp32/.test(post.tags.join(' '))
            ? ['llm-vram-calc', 'token-inspector', 'esp32-llm-bridge'] : /audio|music/.test(post.tags.join(' '))
            ? ['guitar-tuner', 'note-frequency', 'chiptune'] : ['notes', 'patterns', 'payload']} />
    </>;
}
