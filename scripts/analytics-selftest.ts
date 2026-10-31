import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import type { D1Database } from '@cloudflare/workers-types';
import { parseUsageEvent, shouldIgnoreUsage } from '../lib/analytics/validation.ts';
import { browserPage } from '../lib/analytics/paths.ts';
import { recordUsage, pruneUsage, readUsage } from '../lib/analytics/storage.ts';
import { usageRange, summarizeUsage } from '../lib/analytics/summary.ts';
import { EVENT_NAMES, type UsageEvent } from '../lib/analytics/model.ts';
import { isTelemetryEnabled, setTelemetryEnabled } from '../lib/telemetry.ts';
import { sendUsage } from '../lib/analytics/client.ts';

const sqlite = new DatabaseSync(':memory:');
sqlite.exec(readFileSync('migrations/0001_init.sql', 'utf8'));
sqlite.exec(readFileSync('migrations/0003_usage_events.sql', 'utf8'));
sqlite.exec(`INSERT INTO users (id,github_id,github_login) VALUES ('private-user',123,'private-login');
  INSERT INTO usage_events (id,user_id,event_name,path,locale,tool_id,ua,country,cf_ray) VALUES
    ('old1','private-user','page_view','/es/workbench/spaces/secret-name','es',NULL,'private-ua','AR','private-ray'),
    ('old2',NULL,'tool_open','/es/workbench/hash-digest','es','hash-digest',NULL,NULL,NULL);
  INSERT INTO usage_events (id,event_name,path,created_at) VALUES ('expired','page_view','/secret',1);`);
sqlite.exec(readFileSync('migrations/0007_usage_aggregates.sql', 'utf8'));
assert.equal(sqlite.prepare("SELECT name FROM sqlite_master WHERE name = 'usage_events'").get(), undefined);
const migrated = sqlite.prepare('SELECT * FROM usage_daily').all();
assert.equal(migrated.length, 2);
assert.ok(migrated.every(row => row.version === 1 && row.path === '/legacy'));
assert.doesNotMatch(JSON.stringify(migrated), /private|secret/);
assert.deepEqual(sqlite.prepare('PRAGMA table_info(usage_receipts)').all().map(row => row.name), ['id', 'day']);

// Execute the production SQL against real SQLite; the HTTP suite also uses D1.
function prepare(sql: string) {
  let values: (string | number | null)[] = [];
  const stmt = {
    bind(...args: (string | number | null)[]) { values = args; return stmt; },
    run() { return sqlite.prepare(sql).run(...values); },
    async all() { return { results: sqlite.prepare(sql).all(...values) }; },
  };
  return stmt;
}
const db = { prepare, async batch(statements: ReturnType<typeof prepare>[]) {
  sqlite.exec('BEGIN');
  try { const result = statements.map(statement => statement.run()); sqlite.exec('COMMIT'); return result; }
  catch (error) { sqlite.exec('ROLLBACK'); throw error; }
} } as unknown as D1Database;
const event: UsageEvent = { version: 2, eventId: crypto.randomUUID(), eventName: 'tool_open', path: '/workbench/hash-digest', locale: 'es', toolId: 'hash-digest' };
assert.deepEqual(parseUsageEvent(event), event);
for (const invalid of [null, [], {}, { ...event, eventId: 'person@example.org' }, { ...event, metadata: { content: 'secret' } },
  { ...event, path: '/workbench/spaces/private' }, { ...event, path: '/workbench/hash-digest?secret=1' },
  { ...event, toolId: 'made-up-tool' }, { ...event, locale: 'xx' }, { ...event, eventName: 'search_open' },
  { ...event, path: '/workbench/notes' }, { ...event, path: '/workbench/settings' }]) assert.equal(parseUsageEvent(invalid), null);
assert.equal(browserPage('/es/admin'), null);
assert.equal(browserPage('/es/workbench/usage-analytics'), null);
assert.equal(browserPage('/es/workbench/spaces/private-name')?.path, '/workbench/spaces');
assert.equal(browserPage('/en/blog/private-title')?.path, '/blog/:article');
for (const headers of [{ dnt: '1' }, { 'sec-gpc': '1' }, { 'user-agent': 'Googlebot/2.1' }, { 'user-agent': 'HeadlessChrome/130' }]) {
  assert.equal(shouldIgnoreUsage(new Headers(headers)), true);
}
assert.equal(shouldIgnoreUsage(new Headers({ 'user-agent': 'Mozilla/5.0 Chrome/130' })), false);
assert.equal(shouldIgnoreUsage(new Headers(), { verifiedBot: true }), true);
assert.equal(shouldIgnoreUsage(new Headers(), { score: 29 }), true);
assert.equal(shouldIgnoreUsage(new Headers(), { score: 30 }), false);
assert.equal(shouldIgnoreUsage(new Headers(), { score: 0 }), false);
assert.equal(shouldIgnoreUsage(new Headers({ 'cf-bot-score': '1' })), false);

await recordUsage(db, event);
await recordUsage(db, event);
assert.equal(sqlite.prepare('SELECT SUM(count) AS n FROM usage_daily WHERE version=2').get()?.n, 1);
await recordUsage(db, { ...event, eventId: crypto.randomUUID(), eventName: 'handoff_complete' });
assert.equal(sqlite.prepare('SELECT SUM(count) AS n FROM usage_daily WHERE version=2').get()?.n, 2);
// Failure of the receipt write rolls back the aggregate, so retries do not inflate.
sqlite.exec("CREATE TRIGGER fail_receipt BEFORE INSERT ON usage_receipts BEGIN SELECT RAISE(ABORT,'test'); END;");
await assert.rejects(recordUsage(db, { ...event, eventId: crypto.randomUUID() }));
assert.equal(sqlite.prepare('SELECT SUM(count) AS n FROM usage_daily WHERE version=2').get()?.n, 2);
sqlite.exec('DROP TRIGGER fail_receipt;');

const range = usageRange(30);
const rows = await readUsage(db, range.from, range.to);
const summary = summarizeUsage(rows, range);
assert.deepEqual(summary.totals, { events: 4, pageViews: 1, toolOpens: 2, handoffsReceived: 1, exportsGenerated: 0, legacyEvents: 2 });
assert.equal(summary.timeline.length, 30 * EVENT_NAMES.length);
assert.equal('uniqueUsers' in summary.totals, false);
assert.deepEqual(usageRange(3, new Date('2024-03-01T00:00:00Z')), { days: 3, from: '2024-02-28', to: '2024-03-01', timezone: 'UTC', includesToday: true, locale: null });

sqlite.exec("INSERT INTO usage_receipts VALUES ('old','2000-01-01'); INSERT INTO usage_daily VALUES ('2000-01-01','page_view','/','','',2,1);");
await pruneUsage(db);
assert.equal(sqlite.prepare("SELECT count(*) AS n FROM usage_receipts WHERE day='2000-01-01'").get()?.n, 0);
assert.equal(sqlite.prepare("SELECT count(*) AS n FROM usage_daily WHERE day='2000-01-01'").get()?.n, 0);
// Cleanup also runs during ingestion if the daily Cron was delayed.
sqlite.exec("INSERT INTO usage_daily VALUES ('2000-01-01','page_view','/','','',2,1);");
await recordUsage(db, { ...event, eventId: crypto.randomUUID() });
assert.equal(sqlite.prepare("SELECT count(*) AS n FROM usage_daily WHERE day='2000-01-01'").get()?.n, 0);

const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
const originalFetch = globalThis.fetch;
const store = new Map<string, string>();
const calls: RequestInit[] = [];
try {
  Object.defineProperty(globalThis, 'window', { configurable: true, value: { localStorage: {
    getItem: (key: string) => store.get(key) ?? null, setItem: (key: string, value: string) => store.set(key, value),
  } } });
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: {} });
  globalThis.fetch = async (_url, init) => { calls.push(init!); return new Response(null, { status: 204 }); };
  sendUsage('page_view', '/es/workbench/hash-digest');
  assert.equal(calls.length, 0);
  store.set('hios-telemetry', 'on');
  assert.equal(isTelemetryEnabled(), false, 'Legacy consent does not opt in to new actions');
  setTelemetryEnabled(true);
  sendUsage('page_view', '/es/workbench/spaces/private-name');
  assert.equal(calls.length, 1);
  sendUsage('export_generated', '/es/workbench/image-convert');
  assert.equal(calls.length, 2);
  assert.equal(JSON.parse(String(calls[1].body)).eventName, 'export_generated');
  sendUsage('export_generated', '/es/workbench/spaces');
  assert.equal(calls.length, 2, 'Exports outside supported tools are not sent');
  assert.equal(calls[0].credentials, 'omit');
  assert.equal(calls[0].referrerPolicy, 'no-referrer');
  assert.doesNotMatch(String(calls[0].body), /private-name/);
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { doNotTrack: '1' } });
  assert.equal(isTelemetryEnabled(), false);
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { globalPrivacyControl: true } });
  assert.equal(isTelemetryEnabled(), false);
  sendUsage('tool_open', '/es/workbench/hash-digest');
  assert.equal(calls.length, 2);
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: {} });
  setTelemetryEnabled(false);
  assert.equal(isTelemetryEnabled(), false);
  Object.defineProperty(globalThis, 'window', { configurable: true, value: { get localStorage() { throw new Error('blocked'); } } });
  assert.equal(isTelemetryEnabled(), false);
} finally {
  globalThis.fetch = originalFetch;
  if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow); else Reflect.deleteProperty(globalThis, 'window');
  if (originalNavigator) Object.defineProperty(globalThis, 'navigator', originalNavigator); else Reflect.deleteProperty(globalThis, 'navigator');
  sqlite.close();
}
console.log('Analytics migration, minimization, validation, idempotency, rollback, retention, UTC summaries and consent: OK');
