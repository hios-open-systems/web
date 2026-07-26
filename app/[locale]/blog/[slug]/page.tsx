import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { getPostSlugs, getPostBySlug } from '@/lib/blog';
import { BlogPost } from '@/components/blog/BlogPost';

const locales = ['en', 'es', 'de', 'it'];

export const dynamic = 'force-static';
export function generateStaticParams() {
    const slugs = getPostSlugs();
    return locales.flatMap((locale) => slugs.map((slug) => ({ locale, slug })));
}

export default async function BlogPostPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
    const { locale, slug } = await params;
    setRequestLocale(locale);
    const post = getPostBySlug(slug);
    if (!post) notFound();
    return <BlogPost post={post} locale={locale} />;
}
