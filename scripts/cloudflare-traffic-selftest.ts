import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { aggregateTrafficBatch, aggregateTrafficDay, parseTrafficLimits, parseTrafficSnapshot } from '../lib/analytics/cloudflare-validation.ts';
import { TRAFFIC_LIMIT, trafficQuery, trafficTotals, trafficWindows } from '../lib/analytics/cloudflare-traffic.ts';

const from = '2026-10-23T00:00:00.000Z';
const to = '2026-10-24T00:00:00.000Z';
const group = (count: number, category = '', type = 'html', status = 200) => ({
  count, sum: { edgeResponseBytes: count * 100 }, avg: { sampleInterval: 10 },
  dimensions: { verifiedBotCategory: category, edgeResponseContentTypeName: type, edgeResponseStatus: status },
});
const daily = aggregateTrafficDay([group(100), group(20, 'Search Engine Crawler'), group(30, 'Future category'),
  group(40, '', 'js'), group(10, '', 'html', 404), group(10, '', 'html', 302)], from, to);
assert.equal(daily.allRequests, 210); // Already weighted: must not become 2,100.
assert.equal(daily.remainingRequests, 160); // Unclassified is not labelled human.
assert.equal(daily.excludedVerifiedRequests, 50);
assert.equal(daily.htmlRequests, 100); // Assets, errors, redirects and bots excluded.
assert.equal(daily.remainingBytes, 16_000);
assert.equal(trafficTotals([daily]).allBytes, 21_000);
assert.equal(aggregateTrafficDay([], from, to).sampleIntervalMin, null);
assert.throws(() => aggregateTrafficDay(Array(TRAFFIC_LIMIT).fill(group(1)), from, to), /Incomplete/);
assert.throws(() => aggregateTrafficDay([{ ...group(1), dimensions: { ...group(1).dimensions, clientIP: 'PRIVATE' } }], from, to));
assert.throws(() => aggregateTrafficDay([{ ...group(1), dimensions: { ...group(1).dimensions, verifiedBotCategory: null } }], from, to));
assert.throws(() => aggregateTrafficDay([{ ...group(1), avg: { sampleInterval: null } }], from, to));
assert.throws(() => aggregateTrafficDay([group(-1)], from, to));

const settings = { enabled: true, availableFields: ['count', 'sum_edgeResponseBytes', 'avg_sampleInterval',
  'dimensions_verifiedBotCategory', 'dimensions_edgeResponseContentTypeName', 'dimensions_edgeResponseStatus', 'dimensions_date'],
  maxDuration: 2_592_000, notOlderThan: 2_678_400, maxPageSize: TRAFFIC_LIMIT };
assert.equal(parseTrafficLimits(settings), 2_678_400);
assert.throws(() => parseTrafficLimits({ ...settings, enabled: false }));
assert.throws(() => parseTrafficLimits({ ...settings, availableFields: settings.availableFields.filter(key => !key.includes('Bot')) }));

const windows = trafficWindows(new Date('2024-03-01T12:30:05.000Z'), 31 * 86_400);
assert.equal(windows.length, 32);
assert.ok(windows.some(window => window.from === '2024-02-29T00:00:00.000Z'));
assert.equal(windows.at(-1)?.to, '2024-03-01T12:30:00.000Z');
for (let index = 1; index < windows.length; index++) assert.equal(windows[index - 1].to, windows[index].from);
assert.throws(() => trafficWindows(new Date('invalid'), 31 * 86_400));
assert.throws(() => trafficWindows(new Date(), NaN));
const dated = { ...group(20), dimensions: { ...group(20).dimensions, date: from.slice(0, 10) } };
assert.equal(aggregateTrafficBatch([dated], [{ from, to }])[0].allRequests, 20);
assert.throws(() => aggregateTrafficBatch([dated], [{ from: '2026-10-22T00:00:00.000Z', to: from }]), /date/);
assert.throws(() => aggregateTrafficBatch([{ ...dated, secret: 'PRIVATE' }], [{ from, to }]));
const query = JSON.stringify(trafficQuery('zone', from, to));
assert.match(query, /eyeball/);
assert.match(query, /openhios.dev/);
assert.doesNotMatch(query, /clientIP|clientRequestPath|userAgent|cookie|sessionId|visits|rayName/);

const file = new URL('../data/analytics/cloudflare-traffic.json', import.meta.url);
const before = readFileSync(file, 'utf8');
const snapshot = parseTrafficSnapshot(JSON.parse(before));
assert.ok(snapshot.daily.length > 0);
assert.throws(() => parseTrafficSnapshot({ ...snapshot, userId: 'PRIVATE' }));
assert.throws(() => parseTrafficSnapshot({ ...snapshot, daily: snapshot.daily.slice(1) }));
assert.throws(() => parseTrafficSnapshot({ ...snapshot, daily: [{ ...snapshot.daily[0], remainingRequests: -1 }, ...snapshot.daily.slice(1)] }));
assert.doesNotMatch(before, /clientIP|userAgent|cookie|sessionId|accountId|zoneId/);
const env = { ...process.env };
delete env.CLOUDFLARE_ANALYTICS_TOKEN;
const denied = spawnSync(process.execPath, ['--experimental-strip-types', 'scripts/import-cloudflare-traffic.ts'], { env, encoding: 'utf8' });
assert.equal(denied.status, 1);
assert.match(denied.stderr, /Set CLOUDFLARE_ANALYTICS_TOKEN/);
assert.equal(readFileSync(file, 'utf8'), before, 'Failed import must preserve the last snapshot');

// Exercise the complete CLI without network access. Partial GraphQL data must
// never overwrite the previous, reviewable snapshot.
const mock = `
let reads = 0;
globalThis.fetch = async (url, options) => {
  let body;
  if (url.includes('/zones?')) body = {success:true,result:[{id:'a'.repeat(32),name:'openhios.dev'}]};
  else if (JSON.parse(options.body).query.includes('query Limits')) {
    body = {data:{viewer:{zones:[{settings:{httpRequestsAdaptiveGroups:${JSON.stringify(settings)}}}]}}};
  } else {
    reads++;
    body = {data:{viewer:{zones:[{groups:[]}]}}};
    if (reads === 2) body.errors = [{message:'Synthetic aggregate failure'}];
  }
  return Response.json(body);
};`;
const failedRead = spawnSync(process.execPath, ['--experimental-strip-types', '--import',
  `data:text/javascript,${encodeURIComponent(mock)}`, 'scripts/import-cloudflare-traffic.ts'],
{ env: { ...env, CLOUDFLARE_ANALYTICS_TOKEN: 'SYNTHETIC_TEST_TOKEN' }, encoding: 'utf8' });
assert.equal(failedRead.status, 1);
assert.match(failedRead.stdout, /Validated 16/);
assert.match(failedRead.stderr, /Synthetic aggregate failure/);
assert.doesNotMatch(failedRead.stderr, /SYNTHETIC_TEST_TOKEN/);
assert.equal(readFileSync(file, 'utf8'), before, 'Partial GraphQL data must not overwrite the snapshot');
console.log('Cloudflare aggregate privacy, sampling, bot partitions, UTC coverage and fail-closed import: OK');
