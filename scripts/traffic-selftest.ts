import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import type { D1Database } from '@cloudflare/workers-types';
import { classify, referrerOf, splitPath } from '../lib/traffic/classify.ts';
import { ipPrefix, visitorId, clientId } from '../lib/traffic/identity.ts';
import { recordTraffic, pruneTraffic } from '../lib/traffic/record.ts';
import { readTrafficSummary, readRequestBreakdown, readTopClients, trafficRange } from '../lib/traffic/read.ts';
import { TRAFFIC_SCHEMA } from '../lib/traffic/schema.ts';

// Migration and runtime schema must not drift.
const squash = (sql: string) => sql.replace(/--.*$/gm, '').replace(/\s+/g, ' ').replace(/;\s*/g, ';').trim();
assert.equal(squash(readFileSync('migrations/0009_traffic.sql', 'utf8')), squash(TRAFFIC_SCHEMA.map(sql => `${sql};`).join('\n')));

// D1 shim over real SQLite so the production SQL runs.
const sqlite = new DatabaseSync(':memory:');
function prepare(sql: string) {
  let values: (string | number | null)[] = [];
  const stmt = {
    bind(...args: (string | number | null)[]) { values = args; return stmt; },
    run() { return sqlite.prepare(sql).run(...values); },
    async all() { return { results: sqlite.prepare(sql).all(...values).map(row => ({ ...row })) }; },
  };
  return stmt;
}
const db = { prepare, async batch(statements: ReturnType<typeof prepare>[]) {
  sqlite.exec('BEGIN');
  try { const result = statements.map(statement => statement.run()); sqlite.exec('COMMIT'); return result; }
  catch (error) { sqlite.exec('ROLLBACK'); throw error; }
} } as unknown as D1Database;

// Paths and referrers.
assert.deepEqual(splitPath('/es/projects/pad/'), { path: '/projects/pad', locale: 'es' });
assert.deepEqual(splitPath('/es'), { path: '/', locale: 'es' });
assert.deepEqual(splitPath('/wp-login.php'), { path: '/wp-login.php', locale: '' });
assert.equal(referrerOf(new URL('https://openhios.dev/es'), 'https://www.google.com/search?q=x'), 'google.com');
assert.equal(referrerOf(new URL('https://openhios.dev/es'), 'https://openhios.dev/en'), '');
assert.equal(referrerOf(new URL('https://openhios.dev/es?utm_source=Reddit'), null), 'utm:reddit');
assert.equal(referrerOf(new URL('https://openhios.dev/es?ref=<script>'), 'not a url'), '');

// Classification.
const chrome = 'Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 Chrome/130 Safari/537.36';
const req = (path: string, headers: Record<string, string> = {}, method = 'GET') =>
  new Request(`https://openhios.dev${path}`, { method, headers: { 'user-agent': chrome, 'cf-connecting-ip': '203.0.113.7', ...headers } });
assert.equal(classify(req('/es'), 200, 'text/html').pageView, true);
assert.equal(classify(req('/es/tools', { rsc: '1' }), 200, 'text/x-component').kind, 'nav');
assert.equal(classify(req('/es/tools', { rsc: '1' }), 200, 'text/x-component').pageView, true);
assert.equal(classify(req('/es/tools', { rsc: '1', 'next-router-prefetch': '1' }), 200, 'text/x-component').pageView, false);
assert.equal(classify(req('/es/nope'), 404, 'text/html').pageView, false);
assert.equal(classify(req('/api/stats/public'), 200, 'application/json').kind, 'api');
assert.equal(classify(req('/es', { 'user-agent': 'Googlebot/2.1' }), 200, 'text/html').bot, true);
assert.equal(classify(req('/es', { 'user-agent': 'curl/8.0' }), 200, 'text/html').pageView, false);
assert.equal(classify(req('/es', { 'user-agent': '' }), 200, 'text/html').bot, true);
assert.equal(classify(req('/es'), 200, 'text/html', true).bot, true);

// Anonymous identity.
assert.equal(ipPrefix('203.0.113.7'), '203.0.113.0/24');
assert.equal(ipPrefix('2001:db8:abcd:12::1'), '2001:db8:abcd::/48');
assert.equal(ipPrefix('2001:db8::1'), '2001:db8:0::/48');
const secret = 'test-secret';
assert.notEqual(await visitorId(secret, '2026-10-30', '1.2.3.4', chrome), await visitorId(secret, '2026-10-31', '1.2.3.4', chrome));
assert.equal(await clientId(secret, '1.2.3.4'), await clientId(secret, '1.2.3.4'));
assert.match(await clientId(secret, '1.2.3.4'), /^[0-9a-f]{12}$/);

// Recording end to end.
const env = { DB: db, ANALYTICS_SALT: secret };
const html = (status = 200) => new Response('', { status, headers: { 'content-type': 'text/html' } });
const now = new Date('2026-10-31T10:00:00Z');
const cf = { country: 'AR', asn: 7303, asOrganization: 'Telecom Argentina' };
await recordTraffic(env, req('/es', { referer: 'https://news.ycombinator.com/item' }), html(), cf, now);
await recordTraffic(env, req('/es/projects/pad'), html(), cf, now);
await recordTraffic(env, req('/en/tools', {}, 'GET'), html(), { country: 'DE' }, now);
await recordTraffic(env, req('/es', { 'user-agent': 'Googlebot/2.1', 'cf-connecting-ip': '66.249.0.1' }), html(), { country: 'US' }, now);
await recordTraffic(env, req('/wp-login.php', { 'cf-connecting-ip': '198.51.100.9', 'user-agent': 'python-requests/2' }), html(404), { country: 'CN' }, now);
await recordTraffic(env, req('/_next/static/chunk.js'), new Response('', { headers: { 'content-type': 'text/javascript' } }), cf, now);
await recordTraffic(env, req('/es', {}, 'HEAD'), html(), cf, now);

const range = trafficRange(7, now);
const summary = await readTrafficSummary(db, range, 20, now);
assert.equal(summary.totals.views, 3);
assert.equal(summary.totals.visitors, 1); // Same IP+UA on one day is one visitor.
assert.equal(summary.perDay.length, 7);
assert.deepEqual(summary.referrers, [{ name: 'news.ycombinator.com', count: 1 }]);
assert.deepEqual(summary.countries, [{ name: 'AR', count: 2 }, { name: 'DE', count: 1 }]);
assert.deepEqual(summary.pages.map(row => row.name).sort(), ['/', '/projects/pad', '/tools']);
assert.doesNotMatch(JSON.stringify(sqlite.prepare('SELECT * FROM traffic_clients').all()), /203\.0\.113\.7|198\.51\.100\.9/);

const breakdown = await readRequestBreakdown(db, range);
assert.equal(breakdown.reduce((sum, row) => sum + row.requests, 0), 5); // Assets and HEAD skipped.
assert.equal(breakdown.filter(row => row.bot).reduce((sum, row) => sum + row.requests, 0), 2);

const clients = await readTopClients(db, range);
const scanner = clients.find(row => row.ip_prefix === '198.51.100.0/24');
assert.ok(scanner);
assert.equal(scanner.not_found, 1);
assert.equal(scanner.last_path, 'GET /wp-login.php');
assert.equal(scanner.country, 'CN');

// A flood above the limiter stops writing.
let calls = 0;
const limited = { ...env, RATE_LIMIT_120: { async limit() { calls += 1; return { success: false }; } } };
await recordTraffic(limited, req('/es'), html(), cf, now);
assert.equal(calls, 1);
assert.equal((await readTrafficSummary(db, range, 20, now)).totals.views, 3);

// Retention.
sqlite.exec("INSERT INTO traffic_clients VALUES ('2000-01-01','x','ua','p',0,'','XX',0,1,0,0,'/',200,'t')");
await pruneTraffic(db);
assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM traffic_clients WHERE day = '2000-01-01'").get()?.n, 0);
console.log('traffic selftest ok');
