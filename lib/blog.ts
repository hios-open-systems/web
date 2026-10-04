import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const BLOG_DIR = path.join(process.cwd(), 'content', 'blog');

/** Taxonomía del devlog: 'devlog' = bitácora, 'referencia' = doc técnico permanente. */
export type PostCategory = 'devlog' | 'referencia';

export interface PostMeta {
    slug: string;
    title: string;
    date: string;   // ISO yyyy-mm-dd (string en el frontmatter)
    summary: string;
    tags: string[];
    lang: string;
    category: PostCategory;
}

export interface Post extends PostMeta {
    content: string;
}

function parseFile(file: string, locale: string): Post | null {
    const translatedPath = ['en', 'de', 'it'].includes(locale)
        ? path.join(BLOG_DIR, locale, file)
        : null;
    const sourcePath = translatedPath && fs.existsSync(translatedPath)
        ? translatedPath
        : path.join(BLOG_DIR, file);
    const raw = fs.readFileSync(sourcePath, 'utf8');
    const { data, content } = matter(raw);
    if (!data.title || !data.date) return null;
    return {
        slug: file.replace(/\.md$/, ''),
        title: String(data.title),
        date: String(data.date),
        summary: String(data.summary ?? ''),
        tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
        lang: String(data.lang ?? 'es'),
        category: data.category === 'referencia' ? 'referencia' : 'devlog',
        content,
    };
}

export function getAllPosts(locale = 'es'): Post[] {
    if (!fs.existsSync(BLOG_DIR)) return [];
    return fs
        .readdirSync(BLOG_DIR)
        .filter((f) => f.endsWith('.md'))
        .map((file) => parseFile(file, locale))
        .filter((p): p is Post => p !== null)
        .sort((a, b) => (a.date < b.date ? 1 : -1));   // más nuevo primero
}

export function getAllPostMeta(locale = 'es'): PostMeta[] {
    return getAllPosts(locale).map((p) => ({
        slug: p.slug,
        title: p.title,
        date: p.date,
        summary: p.summary,
        tags: p.tags,
        lang: p.lang,
        category: p.category,
    }));
}

export function getPostSlugs(): string[] {
    return getAllPosts().map((p) => p.slug);
}

export function getPostBySlug(slug: string, locale = 'es'): Post | null {
    return getAllPosts(locale).find((p) => p.slug === slug) ?? null;
}
