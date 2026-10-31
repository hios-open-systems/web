import type { D1Database } from '@cloudflare/workers-types';
import { ensureTrafficSchema } from './record.ts';

export interface Ranked { name: string; count: number }
export interface TrafficSummary {
  range: { days: number; from: string; to: string; timezone: 'UTC' };
  generatedAt: string;
  totals: { views: number; visitors: number };
  perDay: { day: string; views: number; visitors: number }[];
  pages: Ranked[];
  referrers: Ranked[];
  countries: Ranked[];
  locales: Ranked[];
}
export interface RequestBreakdown { kind: string; status: number; bot: number; requests: number }
export interface TrafficClient {
  client: string; ua: string; ip_prefix: string; asn: number; as_org: string; country: string; bot: number;
  requests: number; errors: number; not_found: number; last_path: string; last_status: number; last_seen: string;
}

export function trafficRange(days: number, now = new Date()): TrafficSummary['range'] {
  const to = now.toISOString().slice(0, 10);
  const start = new Date(`${to}T00:00:00Z`);
  start.setUTCDate(start.getUTCDate() - days + 1);
  return { days, from: start.toISOString().slice(0, 10), to, timezone: 'UTC' };
}

function rangeDays(range: TrafficSummary['range']) {
  const first = Date.parse(`${range.from}T00:00:00Z`);
  return Array.from({ length: range.days }, (_, i) => new Date(first + i * 86_400_000).toISOString().slice(0, 10));
}

async function ranked(db: D1Database, column: string, range: TrafficSummary['range'], limit: number) {
  const rows = await db.prepare(`SELECT ${column} AS name, SUM(views) AS count FROM traffic_pages
    WHERE day BETWEEN ? AND ? AND ${column} != '' GROUP BY ${column} ORDER BY count DESC, name LIMIT ?`)
    .bind(range.from, range.to, limit).all<Ranked>();
  return rows.results;
}

export async function readTrafficSummary(db: D1Database, range: TrafficSummary['range'], limit = 20, now = new Date()): Promise<TrafficSummary> {
  await ensureTrafficSchema(db);
  const [views, visitors, pages, referrers, countries, locales] = await Promise.all([
    db.prepare('SELECT day, SUM(views) AS count FROM traffic_pages WHERE day BETWEEN ? AND ? GROUP BY day').bind(range.from, range.to).all<{ day: string; count: number }>(),
    db.prepare('SELECT day, COUNT(*) AS count FROM traffic_visitors WHERE day BETWEEN ? AND ? GROUP BY day').bind(range.from, range.to).all<{ day: string; count: number }>(),
    ranked(db, 'path', range, limit), ranked(db, 'referrer', range, limit),
    ranked(db, 'country', range, limit), ranked(db, 'locale', range, 8),
  ]);
  const viewsBy = new Map(views.results.map(row => [row.day, row.count]));
  const visitorsBy = new Map(visitors.results.map(row => [row.day, row.count]));
  const perDay = rangeDays(range).map(day => ({ day, views: viewsBy.get(day) ?? 0, visitors: visitorsBy.get(day) ?? 0 }));
  return {
    range, generatedAt: now.toISOString(),
    totals: perDay.reduce((sum, day) => ({ views: sum.views + day.views, visitors: sum.visitors + day.visitors }), { views: 0, visitors: 0 }),
    perDay, pages, referrers, countries, locales,
  };
}

export async function readRequestBreakdown(db: D1Database, range: TrafficSummary['range']): Promise<RequestBreakdown[]> {
  await ensureTrafficSchema(db);
  const rows = await db.prepare(`SELECT kind, status, bot, SUM(requests) AS requests FROM traffic_requests
    WHERE day BETWEEN ? AND ? GROUP BY kind, status, bot ORDER BY requests DESC`).bind(range.from, range.to).all<RequestBreakdown>();
  return rows.results;
}

/** Heaviest clients first. SQLite returns last_path/last_status from the row holding MAX(last_seen). */
export async function readTopClients(db: D1Database, range: TrafficSummary['range'], limit = 50): Promise<TrafficClient[]> {
  await ensureTrafficSchema(db);
  const rows = await db.prepare(`SELECT client, ua, ip_prefix, asn, as_org, country, bot, SUM(requests) AS requests,
    SUM(errors) AS errors, SUM(not_found) AS not_found, last_path, last_status, MAX(last_seen) AS last_seen
    FROM traffic_clients WHERE day BETWEEN ? AND ? GROUP BY client, ua ORDER BY requests DESC LIMIT ?`)
    .bind(range.from, range.to, limit).all<TrafficClient>();
  return rows.results;
}
