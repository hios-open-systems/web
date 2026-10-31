import type { Ranked, TrafficSummary } from './read.ts';

/** Rows below this count are hidden publicly so a single visit cannot be singled out. */
export const PUBLIC_MIN_COUNT = 2;

export interface PublicTraffic extends Omit<TrafficSummary, 'locales'> {
  locales: Ranked[];
  guestbook: number;
}

export function publicTraffic(summary: TrafficSummary, guestbook: number, limit = 10): PublicTraffic {
  const visible = (rows: Ranked[]) => rows.filter(row => row.count >= PUBLIC_MIN_COUNT).slice(0, limit);
  return {
    ...summary,
    pages: visible(summary.pages), referrers: visible(summary.referrers),
    countries: visible(summary.countries), locales: visible(summary.locales), guestbook,
  };
}
