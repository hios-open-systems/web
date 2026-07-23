import type { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { checkRateLimit } from '@/lib/rateLimit';

/**
 * GET /api/stats/public — agregados anónimos para la página /stats.
 *
 * Filosofía: la telemetría es opt-in y esto es la contracara — lo poco que se
 * junta se muestra abierto, agregado y sin nada individual: totales, tools más
 * usadas, actividad por día, y de dónde se usa (país CF + locale). Nunca rutas
 * con ids, nunca user ids, nunca IPs (no se almacenan).
 *
 * Sin auth: no expone nada sensible. Rate-limited + cache en edge (s-maxage)
 * para que no toque D1 en cada hit.
 */

const DAYS = 30;

export async function GET(request: NextRequest) {
    const limited = checkRateLimit(request, 'stats-public', { limit: 30, windowMs: 60_000 });
    if (limited) return limited;

    const sinceEpoch = Math.floor(Date.now() / 1000) - DAYS * 24 * 60 * 60;

    try {
        const db = getDb();

        const totals = await db
            .prepare(
                `SELECT
                    SUM(CASE WHEN event_name = 'page_view' THEN 1 ELSE 0 END) AS page_views,
                    SUM(CASE WHEN event_name = 'tool_open' THEN 1 ELSE 0 END) AS tool_opens
                 FROM usage_events
                 WHERE created_at >= ?`,
            )
            .bind(sinceEpoch)
            .first<{ page_views: number | null; tool_opens: number | null }>();

        const perDay = await db
            .prepare(
                `SELECT date(created_at, 'unixepoch') AS day, COUNT(*) AS count
                 FROM usage_events
                 WHERE created_at >= ?
                 GROUP BY day
                 ORDER BY day ASC`,
            )
            .bind(sinceEpoch)
            .all<{ day: string; count: number }>();

        const topTools = await db
            .prepare(
                `SELECT tool_id, COUNT(*) AS count
                 FROM usage_events
                 WHERE created_at >= ? AND event_name = 'tool_open' AND tool_id IS NOT NULL
                 GROUP BY tool_id
                 ORDER BY count DESC
                 LIMIT 8`,
            )
            .bind(sinceEpoch)
            .all<{ tool_id: string; count: number }>();

        const countries = await db
            .prepare(
                `SELECT country, COUNT(*) AS count
                 FROM usage_events
                 WHERE created_at >= ? AND country IS NOT NULL AND country != ''
                 GROUP BY country
                 ORDER BY count DESC
                 LIMIT 10`,
            )
            .bind(sinceEpoch)
            .all<{ country: string; count: number }>();

        const locales = await db
            .prepare(
                `SELECT locale, COUNT(*) AS count
                 FROM usage_events
                 WHERE created_at >= ? AND locale IS NOT NULL
                 GROUP BY locale
                 ORDER BY count DESC
                 LIMIT 8`,
            )
            .bind(sinceEpoch)
            .all<{ locale: string; count: number }>();

        return Response.json(
            {
                rangeDays: DAYS,
                totals: {
                    pageViews: totals?.page_views ?? 0,
                    toolOpens: totals?.tool_opens ?? 0,
                },
                perDay: perDay.results,
                topTools: topTools.results.map((r) => ({ toolId: r.tool_id, count: r.count })),
                countries: countries.results,
                locales: locales.results,
            },
            {
                status: 200,
                headers: {
                    // 1h en edge; los datos no necesitan frescura de segundos.
                    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
                },
            },
        );
    } catch {
        return Response.json({ error: 'Stats unavailable' }, { status: 500 });
    }
}
