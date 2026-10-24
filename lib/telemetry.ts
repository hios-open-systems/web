/**
 * Browser telemetry preference. Disabled until an explicit opt-in.
 * Do Not Track and Global Privacy Control override opt-in. No account linkage.
 * See /api/usage/events for the event fields stored by the server.
 */

import { readRaw, writeRaw } from './storage/safeLocalStorage.ts';

// A new opt-in is needed for the expanded action metrics. Legacy consent is ignored.
export const TELEMETRY_STORAGE_KEY = 'hios-telemetry-v2';

export function isTelemetryEnabled(): boolean {
    const setting = readRaw(TELEMETRY_STORAGE_KEY);
    if (setting !== 'on') return false;
    if (typeof navigator !== 'undefined' && (navigator.doNotTrack === '1'
        || (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true
        || (typeof window !== 'undefined' && (window as unknown as { doNotTrack?: string }).doNotTrack === '1'))) {
        return false;
    }
    return true;
}

export function setTelemetryEnabled(enabled: boolean): void {
    writeRaw(TELEMETRY_STORAGE_KEY, enabled ? 'on' : 'off');
}
