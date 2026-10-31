/**
 * Server-side traffic tables. The same statements live in
 * migrations/0009_traffic.sql; the Worker also applies them once per isolate
 * so a deploy without `db:migrate` still records data.
 */
export const TRAFFIC_SCHEMA = [
  `CREATE TABLE IF NOT EXISTS traffic_pages (
  day TEXT NOT NULL, path TEXT NOT NULL, locale TEXT NOT NULL, country TEXT NOT NULL, referrer TEXT NOT NULL,
  views INTEGER NOT NULL, PRIMARY KEY (day, path, locale, country, referrer)) WITHOUT ROWID`,
  `CREATE TABLE IF NOT EXISTS traffic_visitors (
  day TEXT NOT NULL, visitor TEXT NOT NULL, PRIMARY KEY (day, visitor)) WITHOUT ROWID`,
  `CREATE TABLE IF NOT EXISTS traffic_requests (
  day TEXT NOT NULL, kind TEXT NOT NULL, status INTEGER NOT NULL, bot INTEGER NOT NULL,
  requests INTEGER NOT NULL, PRIMARY KEY (day, kind, status, bot)) WITHOUT ROWID`,
  `CREATE TABLE IF NOT EXISTS traffic_clients (
  day TEXT NOT NULL, client TEXT NOT NULL, ua TEXT NOT NULL, ip_prefix TEXT NOT NULL, asn INTEGER NOT NULL,
  as_org TEXT NOT NULL, country TEXT NOT NULL, bot INTEGER NOT NULL, requests INTEGER NOT NULL,
  errors INTEGER NOT NULL, not_found INTEGER NOT NULL, last_path TEXT NOT NULL, last_status INTEGER NOT NULL,
  last_seen TEXT NOT NULL, PRIMARY KEY (day, client, ua)) WITHOUT ROWID`,
] as const;

/** Days kept per table. Visitors/pages are tiny; client rows are for abuse triage only. */
export const TRAFFIC_RETENTION = { pages: 400, visitors: 400, requests: 400, clients: 14 } as const;
