import type { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { findSessionWithUser, SESSION_COOKIE, type UserRow } from '@/lib/auth/session';

export interface RequestAuthResult {
    user: UserRow | null;
    error: 'db_unavailable' | null;
}

export async function getRequestAuth(request: NextRequest): Promise<RequestAuthResult> {
    const sessionId = request.cookies.get(SESSION_COOKIE)?.value;
    if (!sessionId) {
        return { user: null, error: null };
    }

    try {
        const db = getDb();
        const result = await findSessionWithUser(db, sessionId);
        return { user: result?.user ?? null, error: null };
    } catch {
        return { user: null, error: 'db_unavailable' };
    }
}

export async function getRequestUser(request: NextRequest): Promise<UserRow | null> {
    const auth = await getRequestAuth(request);
    return auth.user;
}