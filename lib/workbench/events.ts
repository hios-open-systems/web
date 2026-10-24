import { sendUsage } from '../analytics/client';
export type WorkbenchEvent = 'search_select' | 'preset_open' | 'workspace_open' | 'handoff_complete' | 'export_generated';
export function trackWorkbench(eventName: WorkbenchEvent, toolId?: string) {
  sendUsage(eventName, location.pathname, toolId);
}
