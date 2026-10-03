import type { MetadataRoute } from 'next';
import { workbenchTools } from '@/config/workbench';
import { getAllPostMeta } from '@/lib/blog';
import { getProjectSlugs } from '@/lib/projects';
import type { PagePath } from '@/lib/seo';
import { createLocalizedSitemap } from '@/lib/seo-sitemap';

// Filesystem-backed catalogs are read at build time, including on Workers.
export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const paths: PagePath[] = [
    '',
    '/tools',
    '/workbench',
    '/calculators',
    '/composer',
    '/pinouts',
    '/pinouts/pad',
    '/pinouts/btdac',
    '/pinouts/speaker',
    '/projects',
    '/blog',
    '/prints',
    '/guestbook',
    '/stats',
    '/colophon',
    ...workbenchTools.filter((tool) => !tool.external).map((tool) => tool.href as PagePath),
    ...getProjectSlugs().map((slug): PagePath => `/projects/${encodeURIComponent(slug)}`),
    ...getAllPostMeta().map((post): PagePath => `/blog/${encodeURIComponent(post.slug)}`),
  ];
  return createLocalizedSitemap(paths);
}
