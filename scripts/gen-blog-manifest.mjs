// Genera lib/blogManifest.json desde content/blog/*.md (frontmatter -> metadata).
// Corre en `prebuild`/`predev` para que el índice del blog (edge, sin fs) tenga
// la lista de posts sin leer el filesystem en runtime.
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const DIR = path.join(process.cwd(), 'content', 'blog');
const OUT = path.join(process.cwd(), 'lib', 'blogManifest.json');

const posts = (fs.existsSync(DIR) ? fs.readdirSync(DIR) : [])
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
        const { data } = matter(fs.readFileSync(path.join(DIR, f), 'utf8'));
        if (!data.title || !data.date) return null;
        return {
            slug: f.replace(/\.md$/, ''),
            title: String(data.title),
            date: String(data.date),
            summary: String(data.summary ?? ''),
            tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
            lang: String(data.lang ?? 'es'),
        };
    })
    .filter(Boolean)
    .sort((a, b) => (a.date < b.date ? 1 : -1));

fs.writeFileSync(OUT, JSON.stringify(posts, null, 2) + '\n');
console.log(`[blog] manifest: ${posts.length} posts -> lib/blogManifest.json`);
