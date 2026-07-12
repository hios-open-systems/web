import type { MetadataRoute } from 'next';
import { workbenchTools } from '@/config/workbench';

const SITE = (process.env.AUTH_BASE_URL || 'https://openhios.dev').replace(/\/$/, '');
const LOCALES = ['en', 'es', 'de', 'it'];

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    '',
    '/workbench',
    '/calculators',
    '/pinouts',
    '/pinouts/pad',
    '/pinouts/btdac',
    '/pinouts/speaker',
    ...workbenchTools.filter((tool) => !tool.external).map((tool) => tool.href),
  ];
  const now = new Date();
  return LOCALES.flatMap((locale) =>
    paths.map((path) => ({
      url: `${SITE}/${locale}${path}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: path === '' ? 1 : 0.7,
      alternates: {
        languages: Object.fromEntries(LOCALES.map((l) => [l, `${SITE}/${l}${path}`])),
      },
    })),
  );
}
