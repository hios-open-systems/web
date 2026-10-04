import { translatedMetadata } from '@/lib/seo-metadata';
import { setRequestLocale } from 'next-intl/server';
import { BlogIndex } from '@/components/blog/BlogIndex';
import type { PostMeta } from '@/lib/blog';
import manifest from '@/lib/blogLocalizedManifest.json';



const locales = ['en', 'es', 'de', 'it'];


export const dynamic = 'force-static';
export function generateStaticParams() {
    return locales.map((locale) => ({ locale }));
}

export default async function BlogPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);
    const posts = manifest[locale as keyof typeof manifest] ?? manifest.es;
    return <BlogIndex posts={posts as PostMeta[]} locale={locale} />;
}

export const generateMetadata = translatedMetadata('/blog', 'Seo.blog', 'description');
