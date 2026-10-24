import { getCloudflareContext } from '@opennextjs/cloudflare';

export const PUBLIC_STATS_CACHE_CONTROL = 'public, max-age=0, s-maxage=3600, no-transform';

function cacheContext(request: Request) {
  const { ctx } = getCloudflareContext();
  const cache = (caches as CacheStorage & { default: Cache }).default;
  // Ignore query parameters/cookies; this endpoint has no personal variants.
  const url = new URL('/api/stats/public', request.url);
  url.searchParams.set('schema', '2');
  return { cache, ctx, key: new Request(url, { method: 'GET' }) };
}

export async function cachedPublicUsage(request: Request): Promise<Response | undefined> {
  try {
    const { cache, key } = cacheContext(request);
    return await cache.match(key);
  } catch { return undefined; }
}

export function cachePublicUsage(request: Request, response: Response): void {
  if (response.status !== 200 || response.headers.has('set-cookie')) return;
  try {
    const { cache, ctx, key } = cacheContext(request);
    ctx.waitUntil(cache.put(key, response.clone()).catch(() => { console.error('usage_public_cache_write_failed'); }));
  } catch { /* Next's standalone local server has no Workers Cache API. */ }
}
