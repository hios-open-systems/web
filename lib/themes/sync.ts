'use client';

export interface RemoteThemeSettings {
    themeAccent: string | null;
    updatedAt: number | null;
}

interface SettingsResponse {
    settings: RemoteThemeSettings;
}

interface ErrorResponse {
    error?: string;
}

async function parseError(response: Response, fallback: string): Promise<string> {
    try {
        const payload = (await response.json()) as ErrorResponse;
        return payload.error || fallback;
    } catch {
        return fallback;
    }
}

export async function fetchRemoteThemeSettings(): Promise<RemoteThemeSettings> {
    const response = await fetch('/api/user/settings', {
        credentials: 'same-origin',
        cache: 'no-store',
    });

    if (!response.ok) {
        throw new Error(await parseError(response, 'Failed to load account theme settings'));
    }

    const payload = (await response.json()) as SettingsResponse;
    return payload.settings;
}

export async function updateRemoteThemeAccent(themeAccent: string | null): Promise<RemoteThemeSettings> {
    const response = await fetch('/api/user/settings', {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ themeAccent }),
    });

    if (!response.ok) {
        throw new Error(await parseError(response, 'Failed to update account theme settings'));
    }

    const payload = (await response.json()) as SettingsResponse;
    return payload.settings;
}