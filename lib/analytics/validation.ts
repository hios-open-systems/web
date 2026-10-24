import { analyticsPath, ANALYTICS_TOOL_IDS } from './paths.ts';
import { ANALYTICS_LOCALES, EVENT_NAMES, type UsageEvent } from './model.ts';

export function parseUsageEvent(input: unknown): UsageEvent | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const value = input as Record<string, unknown>;
  if (Object.keys(value).some(key => !['version', 'eventId', 'eventName', 'path', 'locale', 'toolId'].includes(key))) return null;
  if (value.version !== 2 || typeof value.eventId !== 'string'
    || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(value.eventId)) return null;
  if (!EVENT_NAMES.includes(value.eventName as UsageEvent['eventName'])
    || !ANALYTICS_LOCALES.includes(value.locale as UsageEvent['locale']) || typeof value.path !== 'string') return null;
  const page = analyticsPath(value.path);
  if (!page || typeof value.toolId !== 'string') return null;
  if (value.toolId && !ANALYTICS_TOOL_IDS.has(value.toolId)) return null;
  if (['tool_open', 'handoff_complete', 'export_generated'].includes(String(value.eventName)) && (!page.toolId || value.toolId !== page.toolId)) return null;
  if (value.eventName === 'page_view' && value.toolId !== page.toolId) return null;
  if (value.eventName === 'preset_open' && !value.toolId) return null;
  if (value.eventName === 'workspace_open' && (value.path !== '/workbench/spaces' || value.toolId !== '')) return null;
  return value as unknown as UsageEvent;
}

/** Headers are used transiently for exclusion; never stored with analytics. */
export interface BotSignals { verifiedBot?: boolean; score?: number }

export function shouldIgnoreUsage(headers: Headers, bots?: BotSignals): boolean {
  if (headers.get('dnt') === '1' || headers.get('sec-gpc') === '1') return true;
  if (bots?.verifiedBot === true || (typeof bots?.score === 'number' && bots.score >= 1 && bots.score < 30)) return true;
  return /bot\b|crawler|spider|headless|lighthouse|pagespeed|monitoring/i.test(headers.get('user-agent') ?? '');
}
