import { getDb } from '@/lib/db';
import { checkRateLimit } from '@/lib/requestRateLimit';
import { readUsage } from '@/lib/analytics/storage';
import { publicUsage, usageRange } from '@/lib/analytics/summary';
import { cachedPublicUsage, cachePublicUsage, PUBLIC_STATS_CACHE_CONTROL } from '@/lib/analytics/public-cache';

export async function GET(request: Request) {
  const cached = await cachedPublicUsage(request);
  if (cached) return cached;
  const limited = await checkRateLimit(request, 'stats-public', { limit: 30, windowMs: 60_000 });
  if (limited) return limited;
  try {
    const db = getDb();
    const now = new Date();
    const range = usageRange(30, now);
    const [rows, guestbook] = await Promise.all([
      readUsage(db, range.from, range.to),
      db.prepare("SELECT COUNT(*) AS count FROM guestbook WHERE status = 'visible'").first<{ count: number }>(),
    ]);
    const response = Response.json(publicUsage(rows, guestbook?.count ?? 0, now), {
      headers: { 'Cache-Control': PUBLIC_STATS_CACHE_CONTROL },
    });
    cachePublicUsage(request, response);
    return response;
  } catch {
    console.error('usage_public_read_failed');
    return Response.json({ error: 'Stats unavailable' }, { status: 503, headers: { 'Cache-Control': 'private, no-store' } });
  }
}
