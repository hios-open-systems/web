import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const BLOG_DIR = path.join(process.cwd(), 'content', 'blog');

export interface PostMeta {
    slug: string;
    title: string;
    date: string;   // ISO yyyy-mm-dd (string en el frontmatter)
    summary: string;
    tags: string[];
    lang: string;
}

export interface Post extends PostMeta {
    content: string;
}

function parseFile(file: string): Post | null {
    const raw = fs.readFileSync(path.join(BLOG_DIR, file), 'utf8');
    const { data, content } = matter(raw);
    if (!data.title || !data.date) return null;
    return {
        slug: file.replace(/\.md$/, ''),
        title: String(data.title),
        date: String(data.date),
        summary: String(data.summary ?? ''),
        tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
        lang: String(data.lang ?? 'es'),
        content,
    };
}

export function getAllPosts(): Post[] {
    if (!fs.existsSync(BLOG_DIR)) return [];
    return fs
        .readdirSync(BLOG_DIR)
        .filter((f) => f.endsWith('.md'))
        .map(parseFile)
        .filter((p): p is Post => p !== null)
        .sort((a, b) => (a.date < b.date ? 1 : -1));   // más nuevo primero
}

export function getAllPostMeta(): PostMeta[] {
    return getAllPosts().map((p) => ({
        slug: p.slug,
        title: p.title,
        date: p.date,
        summary: p.summary,
        tags: p.tags,
        lang: p.lang,
    }));
}

export function getPostSlugs(): string[] {
    return getAllPosts().map((p) => p.slug);
}

export function getPostBySlug(slug: string): Post | null {
    return getAllPosts().find((p) => p.slug === slug) ?? null;
}
