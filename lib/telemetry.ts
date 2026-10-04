/**
 * Browser telemetry preference. Enabled by default; an explicit "off" setting
 * or Do Not Track disables it. Signed-in events can be linked to the account.
 * See /api/usage/events for the event fields stored by the server.
 */

import { readRaw, writeRaw } from './storage/safeLocalStorage.ts';

export const TELEMETRY_STORAGE_KEY = 'hios-telemetry';

export function isTelemetryEnabled(): boolean {
    const setting = readRaw(TELEMETRY_STORAGE_KEY);
    if (setting === 'off') return false;
    if (typeof navigator !== 'undefined' && (navigator.doNotTrack === '1' || (window as unknown as { doNotTrack?: string }).doNotTrack === '1')) {
        return false;
    }
    return true;
}

export function setTelemetryEnabled(enabled: boolean): void {
    writeRaw(TELEMETRY_STORAGE_KEY, enabled ? 'on' : 'off');
}
