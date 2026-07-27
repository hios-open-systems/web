/**
 * Consentimiento de telemetría — OPT-IN, apagada por default.
 *
 * Filosofía del sitio: no trackear, no notificar, no pedir permisos salvo que
 * el usuario lo active explícitamente (Settings → Datos y privacidad). Lo que
 * se envía cuando está activa (ver /api/usage/events): evento (page_view /
 * tool_open), ruta, locale, tool, user-agent, referer y país a nivel CF
 * (cf-ipcountry) — nunca la IP. Si hay sesión, se asocia al user id.
 */

import { readRaw, writeRaw } from './storage/safeLocalStorage.ts';

export const TELEMETRY_STORAGE_KEY = 'hios-telemetry';

export function isTelemetryEnabled(): boolean {
    return readRaw(TELEMETRY_STORAGE_KEY) === 'on';
}

export function setTelemetryEnabled(enabled: boolean): void {
    writeRaw(TELEMETRY_STORAGE_KEY, enabled ? 'on' : 'off');
}
