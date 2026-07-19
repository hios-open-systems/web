import type { NextRequest } from 'next/server';
import { getRequestAuth } from '@/lib/auth/request';
import { getDb } from '@/lib/db';
import { getUserSettings, updateUserSettings, validateThemeAccent, type UpdateUserSettingsInput } from '@/lib/userSettings';


function jsonError(error: string, status: number) {
    return Response.json({ error }, { status });
}

async function requireUser(request: NextRequest) {
    const auth = await getRequestAuth(request);
    if (auth.error) {
        return { response: jsonError('Database unavailable', 503), user: null };
    }
    if (!auth.user) {
        return { response: jsonError('Authentication required', 401), user: null };
    }
    return { response: null, user: auth.user };
}

export async function GET(request: NextRequest) {
    const { response, user } = await requireUser(request);
    if (response || !user) return response;

    try {
        const db = getDb();
        const settings = await getUserSettings(db, user.id);
        return Response.json({ settings }, { status: 200 });
    } catch {
        return jsonError('Failed to load user settings', 500);
    }
}

export async function PATCH(request: NextRequest) {
    const { response, user } = await requireUser(request);
    if (response || !user) return response;

    let payload: UpdateUserSettingsInput | null = null;
    try {
        payload = (await request.json()) as UpdateUserSettingsInput;
    } catch {
        return jsonError('Invalid JSON body', 400);
    }

    if (!payload || typeof payload !== 'object') {
        return jsonError('Invalid user settings payload', 400);
    }

    if ('themeAccent' in payload && payload.themeAccent !== null && typeof payload.themeAccent !== 'string') {
        return jsonError('themeAccent must be a string or null', 400);
    }

    if (typeof payload.themeAccent === 'string') {
        const error = validateThemeAccent(payload.themeAccent);
        if (error) {
            return jsonError(error, 400);
        }
    }

    try {
        const db = getDb();
        const settings = await updateUserSettings(db, user.id, payload);
        return Response.json({ settings }, { status: 200 });
    } catch {
        return jsonError('Failed to update user settings', 500);
    }
}