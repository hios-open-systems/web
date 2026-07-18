import type { NextRequest } from 'next/server';
import { getRequestAuth } from '@/lib/auth/request';
import { getDb } from '@/lib/db';


const DEFAULT_DAYS = 7;
const MAX_DAYS = 90;

function parseDays(raw: string | null): number {
  const value = Number(raw ?? DEFAULT_DAYS);
  if (!Number.isFinite(value)) return DEFAULT_DAYS;
  return Math.max(1, Math.min(MAX_DAYS, Math.floor(value)));
}

function parseLocale(raw: string | null): string | null {
  if (!raw) return null;
  if (!/^[a-z]{2,5}(?:-[A-Z]{2})?$/.test(raw)) return null;
  return raw;
}

function jsonError(error: string, status: number) {
  return Response.json({ error }, { status });
}

export async function GET(request: NextRequest) {
  const auth = await getRequestAuth(request);
  if (auth.error) {
    return jsonError('Database unavailable', 503);
  }
  if (!auth.user) {
    return jsonError('Authentication required', 401);
  }

  const { searchParams } = new URL(request.url);
  const days = parseDays(searchParams.get('days'));
  const locale = parseLocale(searchParams.get('locale'));
  const sinceEpoch = Math.floor(Date.now() / 1000) - days * 24 * 60 * 60;

  try {
    const db = getDb();

    const timeline = await db
      .prepare(
        `SELECT date(created_at, 'unixepoch') AS day, event_name, COUNT(*) AS count
         FROM usage_events
         WHERE created_at >= ?
           AND (? IS NULL OR locale = ?)
         GROUP BY day, event_name
         ORDER BY day DESC, event_name ASC`,
      )
      .bind(sinceEpoch, locale, locale)
      .all<{ day: string; event_name: string; count: number }>();

    const topPages = await db
      .prepare(
        `SELECT path, COUNT(*) AS count
         FROM usage_events
         WHERE created_at >= ?
           AND event_name = 'page_view'
           AND (? IS NULL OR locale = ?)
         GROUP BY path
         ORDER BY count DESC
         LIMIT 20`,
      )
      .bind(sinceEpoch, locale, locale)
      .all<{ path: string; count: number }>();

    const topTools = await db
      .prepare(
        `SELECT tool_id, COUNT(*) AS count
         FROM usage_events
         WHERE created_at >= ?
           AND event_name = 'tool_open'
           AND tool_id IS NOT NULL
           AND (? IS NULL OR locale = ?)
         GROUP BY tool_id
         ORDER BY count DESC
         LIMIT 20`,
      )
      .bind(sinceEpoch, locale, locale)
      .all<{ tool_id: string; count: number }>();

    const totals = await db
      .prepare(
        `SELECT
            COUNT(*) AS total_events,
            SUM(CASE WHEN event_name = 'page_view' THEN 1 ELSE 0 END) AS total_page_views,
            SUM(CASE WHEN event_name = 'tool_open' THEN 1 ELSE 0 END) AS total_tool_opens,
            COUNT(DISTINCT user_id) AS unique_users
         FROM usage_events
         WHERE created_at >= ?
           AND (? IS NULL OR locale = ?)`,
      )
      .bind(sinceEpoch, locale, locale)
      .first<{
        total_events: number | null;
        total_page_views: number | null;
        total_tool_opens: number | null;
        unique_users: number | null;
      }>();

    return Response.json(
      {
        range: {
          days,
          sinceEpoch,
          locale,
        },
        totals: {
          events: totals?.total_events ?? 0,
          pageViews: totals?.total_page_views ?? 0,
          toolOpens: totals?.total_tool_opens ?? 0,
          uniqueUsers: totals?.unique_users ?? 0,
        },
        timeline: timeline.results,
        topPages: topPages.results,
        topTools: topTools.results.map((row) => ({ toolId: row.tool_id, count: row.count })),
      },
      { status: 200 },
    );
  } catch {
    return jsonError('Failed to load usage summary', 500);
  }
}
