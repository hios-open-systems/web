// Explicit, read-only Cloudflare access. Never run this during builds or visits.
import { readFile, mkdir, writeFile, rename } from 'node:fs/promises';
import { homedir } from 'node:os';
import path from 'node:path';
import { setTimeout } from 'node:timers/promises';
import { TRAFFIC_DATASET, TRAFFIC_HOST, trafficQuery, trafficWindows, trafficTotals, type TrafficSnapshot } from '../lib/analytics/cloudflare-traffic.ts';
import { aggregateTrafficBatch, parseTrafficSnapshot, parseTrafficLimits, trafficObject } from '../lib/analytics/cloudflare-validation.ts';

async function tokenFromEnvironment() {
  const args = process.argv.slice(2);
  if (args.some(arg => arg !== '--wrangler')) throw new Error('Use --wrangler or CLOUDFLARE_ANALYTICS_TOKEN');
  if (process.env.CLOUDFLARE_ANALYTICS_TOKEN) return process.env.CLOUDFLARE_ANALYTICS_TOKEN;
  if (!args.includes('--wrangler')) throw new Error('Set CLOUDFLARE_ANALYTICS_TOKEN or explicitly use --wrangler');
  const root = process.platform === 'win32' && process.env.APPDATA
    ? path.join(process.env.APPDATA, 'xdg.config') : process.env.XDG_CONFIG_HOME ?? path.join(homedir(), '.config');
  const config = await readFile(path.join(root, '.wrangler/config/default.toml'), 'utf8');
  const token = config.match(/^oauth_token\s*=\s*"([^"]+)"/m)?.[1];
  if (!token) throw new Error('Existing Wrangler OAuth credential unavailable');
  return token;
}

async function api(token: string, endpoint: string, body?: object): Promise<unknown> {
  const response = await fetch(`https://api.cloudflare.com/client/v4/${endpoint}`, {
    method: body ? 'POST' : 'GET', redirect: 'error', signal: AbortSignal.timeout(30_000),
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) throw new Error(`Cloudflare read failed (HTTP ${response.status}); existing snapshot preserved`);
  const result = trafficObject(await response.json());
  if (result.success === false || (result.errors != null && (!Array.isArray(result.errors) || result.errors.length))) {
    const first = Array.isArray(result.errors) && result.errors.length ? trafficObject(result.errors[0]) : {};
    const reason = typeof first.message === 'string' ? first.message.replaceAll(token, '[redacted]').slice(0, 300) : 'Unknown error';
    throw new Error(`Cloudflare aggregate query rejected: ${reason}. Existing snapshot preserved.`);
  }
  return result;
}

async function zoneId(token: string) {
  const result = trafficObject(await api(token, `zones?name=${TRAFFIC_HOST}`));
  if (!Array.isArray(result.result) || result.result.length !== 1) throw new Error('Expected exactly the openhios.dev zone');
  const zone = trafficObject(result.result[0]);
  if (zone.name !== TRAFFIC_HOST || typeof zone.id !== 'string' || !/^[a-f0-9]{32}$/.test(zone.id)) throw new Error('Invalid zone');
  return zone.id;
}

function onlyZone(response: unknown) {
  const data = trafficObject(trafficObject(response).data);
  const zones = trafficObject(data.viewer).zones;
  if (!Array.isArray(zones) || zones.length !== 1) throw new Error('Incomplete zone response');
  return trafficObject(zones[0]);
}

async function limits(token: string, zone: string) {
  const response = await api(token, 'graphql', {
    query: `query Limits($zone: string) { viewer { zones(filter: {zoneTag: $zone}) {
      settings { httpRequestsAdaptiveGroups { enabled availableFields notOlderThan maxDuration maxPageSize } }
    } } }`, variables: { zone },
  });
  return parseTrafficLimits(trafficObject(onlyZone(response).settings)[TRAFFIC_DATASET]);
}

async function main() {
  const token = await tokenFromEnvironment();
  const zone = await zoneId(token);
  const retentionSeconds = await limits(token, zone);
  const windows = trafficWindows(new Date(), retentionSeconds);
  const daily = [];
  console.log(`Reading ${TRAFFIC_HOST}: ${windows.length} UTC intervals; counts only, no request logs.`);
  for (let offset = 0; offset < windows.length; offset += 16) {
    const batch = windows.slice(offset, offset + 16);
    await setTimeout(1_000); // Keep aggregate reads below one query per second.
    const response = await api(token, 'graphql', trafficQuery(zone, batch[0].from, batch.at(-1)!.to));
    daily.push(...aggregateTrafficBatch(onlyZone(response).groups, batch));
    console.log(`Validated ${daily.length}/${windows.length} UTC intervals.`);
  }
  const snapshot: TrafficSnapshot = { version: 1, source: 'cloudflare-http', dataset: TRAFFIC_DATASET, host: TRAFFIC_HOST,
    generatedAt: new Date().toISOString(), range: { from: windows[0].from, to: windows.at(-1)!.to, timezone: 'UTC' },
    botFilter: 'exclude-any-verified-category', sampling: 'adaptive', retentionSeconds, daily };
  parseTrafficSnapshot(snapshot);
  const target = new URL('../data/analytics/cloudflare-traffic.json', import.meta.url);
  await mkdir(new URL('.', target), { recursive: true });
  const temporary = new URL('./cloudflare-traffic.json.tmp', target);
  await writeFile(temporary, JSON.stringify(snapshot, null, 2) + '\n');
  await rename(temporary, target);
  console.log(JSON.stringify({ from: snapshot.range.from, to: snapshot.range.to, estimates: trafficTotals(daily) }, null, 2));
  console.log('Local snapshot saved. No database writes, configuration changes or deployment.');
}

main().catch(error => { console.error(error instanceof Error ? error.message : 'Traffic import failed'); process.exitCode = 1; });
