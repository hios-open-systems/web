import { TRAFFIC_LIMIT, type TrafficDay, type TrafficSnapshot } from './cloudflare-traffic.ts';

export function trafficObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid aggregate object');
  return value as Record<string, unknown>;
}

function exactKeys(value: Record<string, unknown>, keys: string[]) {
  if (Object.keys(value).sort().join() !== keys.sort().join()) throw new Error('Unexpected aggregate fields');
}

export function trafficNumber(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) throw new Error('Invalid aggregate number');
  return value;
}

export function parseTrafficLimits(value: unknown) {
  const settings = trafficObject(value);
  const availableFields = settings.availableFields;
  const required = ['count', 'sum_edgeResponseBytes', 'avg_sampleInterval', 'dimensions_verifiedBotCategory',
    'dimensions_edgeResponseContentTypeName', 'dimensions_edgeResponseStatus', 'dimensions_date'];
  if (settings.enabled !== true || !Array.isArray(availableFields)
    || required.some(field => !availableFields.includes(field))
    || trafficNumber(settings.maxDuration) < 86_400 || trafficNumber(settings.maxPageSize) < TRAFFIC_LIMIT) {
    throw new Error('Required aggregate fields or bot classification unavailable; refusing unfiltered import');
  }
  return trafficNumber(settings.notOlderThan);
}

function counter(value: unknown) {
  const number = trafficNumber(value);
  if (!Number.isSafeInteger(number)) throw new Error('Invalid aggregate counter');
  return number;
}

function parseGroup(input: unknown) {
  const group = trafficObject(input);
  exactKeys(group, ['count', 'sum', 'avg', 'dimensions']);
  const dimensions = trafficObject(group.dimensions);
  exactKeys(dimensions, ['verifiedBotCategory', 'edgeResponseContentTypeName', 'edgeResponseStatus']);
  if (typeof dimensions.verifiedBotCategory !== 'string' || typeof dimensions.edgeResponseContentTypeName !== 'string') {
    throw new Error('Bot classification or content type unavailable');
  }
  const sum = trafficObject(group.sum);
  const avg = trafficObject(group.avg);
  exactKeys(sum, ['edgeResponseBytes']);
  exactKeys(avg, ['sampleInterval']);
  const sampleInterval = trafficNumber(avg.sampleInterval);
  if (sampleInterval < 1) throw new Error('Sampling information unavailable');
  return { count: counter(group.count), bytes: counter(sum.edgeResponseBytes), sampleInterval,
    verified: dimensions.verifiedBotCategory !== '',
    html: dimensions.edgeResponseContentTypeName === 'html', status: counter(dimensions.edgeResponseStatus) };
}

export function aggregateTrafficDay(input: unknown, from: string, to: string): TrafficDay {
  if (!Array.isArray(input) || input.length >= TRAFFIC_LIMIT) throw new Error('Incomplete aggregate result');
  const day: TrafficDay = { day: from.slice(0, 10), from, to, allRequests: 0, excludedVerifiedRequests: 0,
    remainingRequests: 0, htmlRequests: 0, allBytes: 0, remainingBytes: 0, sampleIntervalMin: null, sampleIntervalMax: null };
  for (const value of input) {
    const group = parseGroup(value);
    // Adaptive counts and byte sums are already weighted. Do not multiply them.
    day.allRequests += group.count;
    day.allBytes += group.bytes;
    day.sampleIntervalMin = Math.min(day.sampleIntervalMin ?? Infinity, group.sampleInterval);
    day.sampleIntervalMax = Math.max(day.sampleIntervalMax ?? 1, group.sampleInterval);
    if (group.verified) { day.excludedVerifiedRequests += group.count; continue; }
    day.remainingRequests += group.count;
    day.remainingBytes += group.bytes;
    if (group.html && group.status >= 200 && group.status < 300) day.htmlRequests += group.count;
  }
  return day;
}

export function aggregateTrafficBatch(input: unknown, windows: { from: string; to: string }[]): TrafficDay[] {
  if (!Array.isArray(input) || input.length >= TRAFFIC_LIMIT) throw new Error('Incomplete aggregate result');
  const byDay = new Map(windows.map(window => [window.from.slice(0, 10), [] as unknown[]]));
  for (const item of input) {
    const group = trafficObject(item);
    const dimensions = trafficObject(group.dimensions);
    exactKeys(dimensions, ['date', 'verifiedBotCategory', 'edgeResponseContentTypeName', 'edgeResponseStatus']);
    if (typeof dimensions.date !== 'string' || !byDay.has(dimensions.date)) throw new Error('Unexpected traffic date');
    const { date, ...rest } = dimensions;
    byDay.get(date)!.push({ ...group, dimensions: rest });
  }
  return windows.map(window => aggregateTrafficDay(byDay.get(window.from.slice(0, 10)), window.from, window.to));
}

const DAY_KEYS = ['day', 'from', 'to', 'allRequests', 'excludedVerifiedRequests', 'remainingRequests',
  'htmlRequests', 'allBytes', 'remainingBytes', 'sampleIntervalMin', 'sampleIntervalMax'];

function validateDay(value: unknown, expectedFrom: string): TrafficDay {
  const day = trafficObject(value);
  exactKeys(day, [...DAY_KEYS]);
  if (day.from !== expectedFrom || typeof day.to !== 'string' || day.day !== expectedFrom.slice(0, 10)
    || !validTime(day.to) || day.to <= expectedFrom || Date.parse(day.to) - Date.parse(expectedFrom) > 86_400_000) {
    throw new Error('Invalid or missing traffic interval');
  }
  for (const key of DAY_KEYS.slice(3, 9)) counter(day[key]);
  if (Number(day.allRequests) !== Number(day.excludedVerifiedRequests) + Number(day.remainingRequests)
    || Number(day.htmlRequests) > Number(day.remainingRequests) || Number(day.remainingBytes) > Number(day.allBytes)) {
    throw new Error('Inconsistent traffic totals');
  }
  if (day.sampleIntervalMin === null && day.sampleIntervalMax === null && day.allRequests === 0) return day as unknown as TrafficDay;
  if (trafficNumber(day.sampleIntervalMin) < 1 || trafficNumber(day.sampleIntervalMax) < Number(day.sampleIntervalMin)) {
    throw new Error('Invalid sampling interval');
  }
  return day as unknown as TrafficDay;
}

function validTime(value: unknown): value is string {
  return typeof value === 'string' && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;
}

export function parseTrafficSnapshot(input: unknown): TrafficSnapshot {
  const value = trafficObject(input);
  exactKeys(value, ['version', 'source', 'dataset', 'host', 'generatedAt', 'range', 'botFilter', 'sampling', 'retentionSeconds', 'daily']);
  if (value.version !== 1 || value.source !== 'cloudflare-http' || value.dataset !== 'httpRequestsAdaptiveGroups'
    || value.host !== 'openhios.dev' || value.botFilter !== 'exclude-any-verified-category' || value.sampling !== 'adaptive'
    || !validTime(value.generatedAt) || trafficNumber(value.retentionSeconds) < 86_400) throw new Error('Invalid traffic provenance');
  const range = trafficObject(value.range);
  exactKeys(range, ['from', 'to', 'timezone']);
  if (!validTime(range.from) || !validTime(range.to) || range.timezone !== 'UTC' || range.to > value.generatedAt
    || !Array.isArray(value.daily) || value.daily.length < 1 || value.daily.length > 32) throw new Error('Invalid traffic range');
  if (Date.parse(range.to) - Date.parse(range.from) > Math.min(Number(value.retentionSeconds), 31 * 86_400) * 1_000) {
    throw new Error('Traffic range exceeds retention');
  }
  let previous = range.from;
  for (const item of value.daily) previous = validateDay(item, previous).to;
  if (previous !== range.to) throw new Error('Incomplete traffic snapshot');
  return value as unknown as TrafficSnapshot;
}
