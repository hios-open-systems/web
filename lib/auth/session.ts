import { cookies } from 'next/headers';
import type { D1Database } from '@cloudflare/workers-types';
import { getDb } from '@/lib/db';

export const SESSION_COOKIE = 'hios_session';
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 días

export interface SessionRow {
    id: string;
    user_id: string;
    expires_at: number;
}

export interface UserRow {
    id: string;
    github_id: number;
    github_login: string;
    name: string | null;
    avatar_url: string | null;
    email: string | null;
}

/** Genera 32 bytes de aleatorio en hex (64 chars). */
export function generateSessionId(): string {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function createSession(db: D1Database, userId: string): Promise<SessionRow> {
    const id = generateSessionId();
    const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
    await db
        .prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)')
        .bind(id, userId, expiresAt)
        .run();
    return { id, user_id: userId, expires_at: expiresAt };
}

export async function deleteSession(db: D1Database, sessionId: string): Promise<void> {
    await db.prepare('DELETE FROM sessions WHERE id = ?').bind(sessionId).run();
}

export async function findSessionWithUser(
    db: D1Database,
    sessionId: string,
): Promise<{ session: SessionRow; user: UserRow } | null> {
    const row = await db
        .prepare(
            `SELECT s.id AS session_id, s.user_id, s.expires_at,
              u.id AS u_id, u.github_id, u.github_login, u.name, u.avatar_url, u.email
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.id = ? AND s.expires_at > ?
       LIMIT 1`,
        )
        .bind(sessionId, Math.floor(Date.now() / 1000))
        .first<{
            session_id: string;
            user_id: string;
            expires_at: number;
            u_id: string;
            github_id: number;
            github_login: string;
            name: string | null;
            avatar_url: string | null;
            email: string | null;
        }>();

    if (!row) {
        return null;
    }

    return {
        session: { id: row.session_id, user_id: row.user_id, expires_at: row.expires_at },
        user: {
            id: row.u_id,
            github_id: row.github_id,
            github_login: row.github_login,
            name: row.name,
            avatar_url: row.avatar_url,
            email: row.email,
        },
    };
}

export function setSessionCookie(sessionId: string) {
    cookies().set(SESSION_COOKIE, sessionId, {
        httpOnly: true,
        sameSite: 'lax',
        secure: true,
        path: '/',
        maxAge: SESSION_TTL_SECONDS,
    });
}

export function clearSessionCookie() {
    cookies().set(SESSION_COOKIE, '', {
        httpOnly: true,
        sameSite: 'lax',
        secure: true,
        path: '/',
        maxAge: 0,
    });
}

export function readSessionCookie(): string | null {
    return cookies().get(SESSION_COOKIE)?.value ?? null;
}

/** Devuelve el usuario actual o null. Tira si la DB no está disponible. */
export async function getCurrentUser(): Promise<UserRow | null> {
    const sessionId = readSessionCookie();
    if (!sessionId) return null;
    try {
        const db = getDb();
        const result = await findSessionWithUser(db, sessionId);
        return result?.user ?? null;
    } catch {
        return null;
    }
}
