/**
 * Consentimiento de telemetría — OPT-IN, apagada por default.
 *
 * Filosofía del sitio: no trackear, no notificar, no pedir permisos salvo que
 * el usuario lo active explícitamente (Settings → Datos y privacidad). Lo que
 * se envía cuando está activa (ver /api/usage/events): evento (page_view /
 * tool_open), ruta, locale, tool, user-agent, referer y país a nivel CF
 * (cf-ipcountry) — nunca la IP. Si hay sesión, se asocia al user id.
 */

export const TELEMETRY_STORAGE_KEY = 'hios-telemetry';

export function isTelemetryEnabled(): boolean {
    if (typeof window === 'undefined') return false;
    try {
        return window.localStorage.getItem(TELEMETRY_STORAGE_KEY) === 'on';
    } catch {
        return false;
    }
}

export function setTelemetryEnabled(enabled: boolean): void {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(TELEMETRY_STORAGE_KEY, enabled ? 'on' : 'off');
    } catch {
        // storage bloqueado: queda apagada, que es el default seguro
    }
}
