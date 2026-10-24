export const EVENT_NAMES = ['page_view', 'tool_open', 'search_select', 'preset_open', 'workspace_open', 'handoff_complete', 'export_generated'] as const;
export type EventName = (typeof EVENT_NAMES)[number];
export const ANALYTICS_LOCALES = ['en', 'es', 'de', 'it'] as const;
export type AnalyticsLocale = (typeof ANALYTICS_LOCALES)[number];
export interface UsageEvent {
  version: 2;
  eventId: string;
  eventName: EventName;
  path: string;
  locale: AnalyticsLocale;
  toolId: string;
}
export interface DailyUsage {
  day: string;
  event_name: EventName;
  path: string;
  locale: string;
  tool_id: string;
  version: number;
  count: number;
}
export interface UsageTotals {
  events: number;
  pageViews: number;
  toolOpens: number;
  handoffsReceived: number;
  exportsGenerated: number;
  legacyEvents: number;
}
export interface UsageSummary {
  range: { days: number; from: string; to: string; timezone: 'UTC'; includesToday: true; locale: string | null };
  totals: UsageTotals;
  timeline: { day: string; event_name: EventName; count: number }[];
  topPages: { path: string; count: number }[];
  topTools: { toolId: string; count: number }[];
}
export interface PublicUsage {
  rangeDays: number;
  range: UsageSummary['range'];
  generatedAt: string;
  totals: UsageTotals & { guestbook: number };
  perDay: { day: string; count: number }[];
  topTools: { toolId: string; count: number }[];
  locales: { locale: string; count: number }[];
}
