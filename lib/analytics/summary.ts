import { EVENT_NAMES, type DailyUsage, type UsageSummary, type UsageTotals } from './model.ts';

export function usageRange(days: number, now = new Date(), locale: string | null = null): UsageSummary['range'] {
  const to = now.toISOString().slice(0, 10);
  const start = new Date(`${to}T00:00:00Z`);
  start.setUTCDate(start.getUTCDate() - days + 1);
  return { days, from: start.toISOString().slice(0, 10), to, timezone: 'UTC', includesToday: true, locale };
}

function daysInRange(range: UsageSummary['range']): string[] {
  const first = Date.parse(`${range.from}T00:00:00Z`);
  return Array.from({ length: range.days }, (_, i) => new Date(first + i * 86400000).toISOString().slice(0, 10));
}

function ranked(rows: DailyUsage[], key: 'path' | 'tool_id' | 'locale', event?: string) {
  const counts = new Map<string, number>();
  for (const row of rows) {
    if (row[key] && (!event || row.event_name === event)) counts.set(row[key], (counts.get(row[key]) ?? 0) + row.count);
  }
  return [...counts].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export function summarizeUsage(rows: DailyUsage[], range: UsageSummary['range']): UsageSummary {
  const totals: UsageTotals = { events: 0, pageViews: 0, toolOpens: 0, handoffsReceived: 0, exportsGenerated: 0, legacyEvents: 0 };
  const timelineCounts = new Map<string, number>();
  for (const row of rows) {
    totals.events += row.count;
    if (row.event_name === 'page_view') totals.pageViews += row.count;
    if (row.event_name === 'tool_open') totals.toolOpens += row.count;
    if (row.event_name === 'export_generated') totals.exportsGenerated += row.count;
    if (row.event_name === 'handoff_complete') totals.handoffsReceived += row.count;
    if (row.version === 1) totals.legacyEvents += row.count;
    const key = `${row.day}:${row.event_name}`;
    timelineCounts.set(key, (timelineCounts.get(key) ?? 0) + row.count);
  }
  return {
    range, totals,
    timeline: daysInRange(range).flatMap(day => EVENT_NAMES.map(event_name => ({ day, event_name, count: timelineCounts.get(`${day}:${event_name}`) ?? 0 }))),
    topPages: ranked(rows, 'path', 'page_view').slice(0, 20).map(row => ({ path: row.name, count: row.count })),
    topTools: ranked(rows, 'tool_id', 'tool_open').slice(0, 20).map(row => ({ toolId: row.name, count: row.count })),
  };
}
