import { setRequestLocale } from 'next-intl/server';
import { BlogIndex } from '@/components/blog/BlogIndex';
import type { PostMeta } from '@/lib/blog';
import manifest from '@/lib/blogManifest.json';

// Índice edge (como el resto de las páginas índice del sitio). NO usa fs: la lista
// sale del manifest precomputado en build (`prebuild` -> lib/blogManifest.json).

const locales = ['en', 'es', 'de', 'it'];

// Fully static: prerenderizada por locale y servida del static-assets cache
// (open-next.config.ts). Evita el re-render SSR de antd en cada isolate frío.
export const dynamic = 'force-static';
export function generateStaticParams() {
    return locales.map((locale) => ({ locale }));
}

export default async function BlogPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);
    return <BlogIndex posts={manifest as PostMeta[]} locale={locale} />;
}
