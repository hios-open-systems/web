import type { MetadataRoute } from 'next';

const SITE = (process.env.AUTH_BASE_URL || 'https://openhios.dev').replace(/\/$/, '');

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/api/'] },
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
