// Generate base and localized blog metadata from content/blog and its locale folders.
// Corre en `prebuild`/`predev` para que el índice del blog (edge, sin fs) tenga
// la lista de posts sin leer el filesystem en runtime.
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const DIR = path.join(process.cwd(), 'content', 'blog');
const OUT = path.join(process.cwd(), 'lib', 'blogManifest.json');

function postsForLocale(locale) {
    return (fs.existsSync(DIR) ? fs.readdirSync(DIR) : [])
        .filter((f) => f.endsWith('.md'))
        .map((f) => {
            const translated = path.join(DIR, locale, f);
            const source = locale !== 'es' && fs.existsSync(translated) ? translated : path.join(DIR, f);
            const { data } = matter(fs.readFileSync(source, 'utf8'));
            if (!data.title || !data.date) return null;
            return {
                slug: f.replace(/\.md$/, ''),
                title: String(data.title),
                date: String(data.date),
                summary: String(data.summary ?? ''),
                tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
                lang: String(data.lang ?? 'es'),
                // 'devlog' (bitácora) | 'referencia' (doc técnico permanente); default devlog.
                category: data.category === 'referencia' ? 'referencia' : 'devlog',
            };
        })
        .filter(Boolean)
        .sort((a, b) => (a.date < b.date ? 1 : -1));
}

const localized = Object.fromEntries(['es', 'en', 'de', 'it'].map((locale) => [locale, postsForLocale(locale)]));
const posts = localized.es;
fs.writeFileSync(path.join(process.cwd(), 'lib', 'blogLocalizedManifest.json'), JSON.stringify(localized, null, 2) + '\n');
fs.writeFileSync(OUT, JSON.stringify(posts, null, 2) + '\n');
console.log(`[blog] manifest: ${posts.length} posts -> lib/blogManifest.json`);
