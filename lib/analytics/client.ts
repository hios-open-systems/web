import { isTelemetryEnabled } from '../telemetry.ts';
import { browserPage } from './paths.ts';
import type { EventName } from './model.ts';
import { parseUsageEvent } from './validation.ts';

export function sendUsage(eventName: EventName, pathname: string, toolId?: string): void {
  if (process.env.NODE_ENV === 'development' || !isTelemetryEnabled()) return;
  const page = browserPage(pathname);
  if (!page) return;
  try {
    const event = parseUsageEvent({ version: 2, eventId: crypto.randomUUID(), eventName, ...page, toolId: toolId ?? page.toolId });
    if (!event) return;
    const body = JSON.stringify(event);
    // Beacon includes cookies. Fetch explicitly omits both credentials and referrer.
    void fetch('/api/usage/events', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body,
      credentials: 'omit', referrerPolicy: 'no-referrer', cache: 'no-store', keepalive: true,
    }).catch(() => { /* No automatic retries. */ });
  } catch { /* Unsupported browser features must not interrupt local tools. */ }
}
