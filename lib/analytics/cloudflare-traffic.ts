export const TRAFFIC_HOST = 'openhios.dev';
export const TRAFFIC_DATASET = 'httpRequestsAdaptiveGroups';
export const TRAFFIC_LIMIT = 10_000;

export interface TrafficDay {
  day: string;
  from: string;
  to: string;
  allRequests: number;
  excludedVerifiedRequests: number;
  remainingRequests: number;
  htmlRequests: number;
  allBytes: number;
  remainingBytes: number;
  sampleIntervalMin: number | null;
  sampleIntervalMax: number | null;
}

export interface TrafficSnapshot {
  version: 1;
  source: 'cloudflare-http';
  dataset: typeof TRAFFIC_DATASET;
  host: typeof TRAFFIC_HOST;
  generatedAt: string;
  range: { from: string; to: string; timezone: 'UTC' };
  botFilter: 'exclude-any-verified-category';
  sampling: 'adaptive';
  retentionSeconds: number;
  daily: TrafficDay[];
}

export function trafficTotals(days: TrafficDay[]) {
  return days.reduce((sum, day) => ({
    allRequests: sum.allRequests + day.allRequests,
    excludedVerifiedRequests: sum.excludedVerifiedRequests + day.excludedVerifiedRequests,
    remainingRequests: sum.remainingRequests + day.remainingRequests,
    htmlRequests: sum.htmlRequests + day.htmlRequests,
    allBytes: sum.allBytes + day.allBytes,
    remainingBytes: sum.remainingBytes + day.remainingBytes,
  }), { allRequests: 0, excludedVerifiedRequests: 0, remainingRequests: 0, htmlRequests: 0, allBytes: 0, remainingBytes: 0 });
}

// Half-open UTC intervals are grouped into query batches, oldest first. The margin
// keeps the first query inside Cloudflare's moving retention boundary.
export function trafficWindows(now: Date, retentionSeconds: number) {
  const to = Math.floor(now.getTime() / 60_000) * 60_000;
  const retention = Math.min(retentionSeconds, 31 * 86_400);
  if (!Number.isFinite(to) || !Number.isFinite(retention) || retention < 86_400) throw new Error('Invalid traffic retention');
  const from = to - retention * 1_000 + 5 * 60_000;
  const windows: { from: string; to: string }[] = [];
  for (let start = from; start < to;) {
    const end = Math.min(to, Math.floor(start / 86_400_000) * 86_400_000 + 86_400_000);
    windows.push({ from: new Date(start).toISOString(), to: new Date(end).toISOString() });
    start = end;
  }
  return windows;
}

export function trafficQuery(zone: string, from: string, to: string) {
  return {
    query: `query Traffic($zone: string, $from: Time, $to: Time) {
      viewer { zones(filter: {zoneTag: $zone}) {
        groups: httpRequestsAdaptiveGroups(limit: ${TRAFFIC_LIMIT}, filter: {
          datetime_geq: $from, datetime_lt: $to,
          requestSource: "eyeball", clientRequestHTTPHost: "${TRAFFIC_HOST}"
        }) {
          count sum { edgeResponseBytes } avg { sampleInterval }
          dimensions { date verifiedBotCategory edgeResponseContentTypeName edgeResponseStatus }
        }
      } }
    }`,
    variables: { zone, from, to },
  };
}
