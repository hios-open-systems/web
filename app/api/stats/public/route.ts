import { getDb } from '@/lib/db';
import { checkRateLimit } from '@/lib/requestRateLimit';
import { readTrafficSummary, trafficRange } from '@/lib/traffic/read';
import { publicTraffic } from '@/lib/traffic/public';
import { cachedPublicUsage, cachePublicUsage, PUBLIC_STATS_CACHE_CONTROL } from '@/lib/analytics/public-cache';

export async function GET(request: Request) {
  const cached = await cachedPublicUsage(request);
  if (cached) return cached;
  const limited = await checkRateLimit(request, 'stats-public', { limit: 30, windowMs: 60_000 });
  if (limited) return limited;
  try {
    const db = getDb();
    const now = new Date();
    const [summary, guestbook] = await Promise.all([
      readTrafficSummary(db, trafficRange(30, now), 50, now),
      db.prepare("SELECT COUNT(*) AS count FROM guestbook WHERE status = 'visible'").first<{ count: number }>(),
    ]);
    const response = Response.json(publicTraffic(summary, guestbook?.count ?? 0), {
      headers: { 'Cache-Control': PUBLIC_STATS_CACHE_CONTROL },
    });
    cachePublicUsage(request, response);
    return response;
  } catch {
    console.error('traffic_public_read_failed');
    return Response.json({ error: 'Stats unavailable' }, { status: 503, headers: { 'Cache-Control': 'private, no-store' } });
  }
}
