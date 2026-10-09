import { isTelemetryEnabled } from '../telemetry';
export type WorkbenchEvent = 'search_open' | 'preset_reuse' | 'workspace_open' | 'handoff_complete';
export function trackWorkbench(eventName: WorkbenchEvent, toolId?: string) {
  if (!isTelemetryEnabled()) return;
  void fetch('/api/usage/events', { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventName, path: location.pathname, toolId }), keepalive: true }).catch(() => {});
}
