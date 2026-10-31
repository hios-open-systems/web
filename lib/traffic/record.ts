import type { D1Database } from '@cloudflare/workers-types';
import { classify } from './classify.ts';
import { clientId, ipPrefix, visitorId } from './identity.ts';
import { TRAFFIC_RETENTION, TRAFFIC_SCHEMA } from './schema.ts';

interface Limiter { limit(options: { key: string }): Promise<{ success: boolean }> }
export interface TrafficEnv {
  DB?: D1Database;
  RATE_LIMIT_120?: Limiter;
  ANALYTICS_SALT?: string;
  GITHUB_CLIENT_SECRET?: string;
}
/** Subset of request.cf that we read. Every field is optional on Cloudflare. */
export interface TrafficCf {
  country?: string;
  asn?: number;
  asOrganization?: string;
  verifiedBotCategory?: string;
  botManagement?: { verifiedBot?: boolean };
}

let schemaReady: Promise<unknown> | null = null;
export function ensureTrafficSchema(db: D1Database) {
  schemaReady ??= db.batch(TRAFFIC_SCHEMA.map(sql => db.prepare(sql))).catch(error => { schemaReady = null; throw error; });
  return schemaReady;
}

function secretOf(env: TrafficEnv) {
  return env.ANALYTICS_SALT || env.GITHUB_CLIENT_SECRET || 'openhios-traffic';
}

/**
 * Record one Worker request. Runs inside ctx.waitUntil, never blocks the response.
 * A client above 120 requests/minute (per location) stops being written until it
 * slows down, so a flood cannot burn the D1 write quota; its row still shows the peak.
 */
export async function recordTraffic(env: TrafficEnv, request: Request, response: Response, cf: TrafficCf = {}, now = new Date()) {
  const db = env.DB;
  if (!db || request.method === 'OPTIONS' || request.method === 'HEAD') return;
  const ip = request.headers.get('cf-connecting-ip') ?? '';
  const ua = (request.headers.get('user-agent') ?? '').slice(0, 200);
  const secret = secretOf(env);
  const client = ip ? await clientId(secret, ip) : 'unknown';
  if (env.RATE_LIMIT_120 && !(await env.RATE_LIMIT_120.limit({ key: `traffic:${client}` })).success) return;

  const verified = cf.botManagement?.verifiedBot === true || Boolean(cf.verifiedBotCategory);
  const facts = classify(request, response.status, response.headers.get('content-type') ?? '', verified);
  if (facts.kind === 'asset' && response.status < 400) return; // Static files say nothing about traction or abuse.
  const day = now.toISOString().slice(0, 10);
  const country = /^[A-Z]{2}$/.test(cf.country ?? '') ? cf.country! : 'XX';
  const error = response.status >= 400 ? 1 : 0;
  const statements = [
    db.prepare(`INSERT INTO traffic_requests (day, kind, status, bot, requests) VALUES (?, ?, ?, ?, 1)
      ON CONFLICT(day, kind, status, bot) DO UPDATE SET requests = requests + 1`)
      .bind(day, facts.kind, Math.floor(response.status / 100) * 100, facts.bot ? 1 : 0),
    db.prepare(`INSERT INTO traffic_clients (day, client, ua, ip_prefix, asn, as_org, country, bot, requests, errors, not_found, last_path, last_status, last_seen)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?)
      ON CONFLICT(day, client, ua) DO UPDATE SET requests = requests + 1, errors = errors + excluded.errors,
        not_found = not_found + excluded.not_found, last_path = excluded.last_path, last_status = excluded.last_status, last_seen = excluded.last_seen`)
      .bind(day, client, ua, ip ? ipPrefix(ip) : 'unknown', cf.asn ?? 0, (cf.asOrganization ?? '').slice(0, 80), country,
        facts.bot ? 1 : 0, error, response.status === 404 ? 1 : 0, `${request.method} ${facts.locale ? `/${facts.locale}` : ''}${facts.path}`.slice(0, 200),
        response.status, now.toISOString()),
  ];
  if (facts.pageView) {
    statements.push(
      db.prepare(`INSERT INTO traffic_pages (day, path, locale, country, referrer, views) VALUES (?, ?, ?, ?, ?, 1)
        ON CONFLICT(day, path, locale, country, referrer) DO UPDATE SET views = views + 1`)
        .bind(day, facts.path, facts.locale, country, facts.referrer),
      db.prepare('INSERT OR IGNORE INTO traffic_visitors (day, visitor) VALUES (?, ?)').bind(day, await visitorId(secret, day, ip, ua)),
    );
  }
  await ensureTrafficSchema(db);
  await db.batch(statements);
}

export async function pruneTraffic(db: D1Database) {
  await ensureTrafficSchema(db);
  const cut = (table: string, days: number) => db.prepare(`DELETE FROM ${table} WHERE day < date('now', ?)`).bind(`-${days} days`);
  await db.batch([
    cut('traffic_pages', TRAFFIC_RETENTION.pages), cut('traffic_visitors', TRAFFIC_RETENTION.visitors),
    cut('traffic_requests', TRAFFIC_RETENTION.requests), cut('traffic_clients', TRAFFIC_RETENTION.clients),
  ]);
}
