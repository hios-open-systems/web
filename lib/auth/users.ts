import type { D1Database } from '@cloudflare/workers-types';
import type { GithubProfile } from './github';
import type { UserRow } from './session';

/** Genera un ID interno para el usuario. */
function generateUserId(): string {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return 'u_' + Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Upsert por github_id: si existe, actualizamos campos mutables; si no, lo creamos.
 * Devuelve la fila final.
 */
export async function upsertUserFromGithub(
    db: D1Database,
    profile: GithubProfile,
): Promise<UserRow> {
    const existing = await db
        .prepare('SELECT id FROM users WHERE github_id = ?')
        .bind(profile.id)
        .first<{ id: string }>();

    if (existing) {
        await db
            .prepare(
                `UPDATE users SET github_login = ?, name = ?, avatar_url = ?, email = ? WHERE id = ?`,
            )
            .bind(profile.login, profile.name, profile.avatar_url, profile.email, existing.id)
            .run();
        return {
            id: existing.id,
            github_id: profile.id,
            github_login: profile.login,
            name: profile.name,
            avatar_url: profile.avatar_url,
            email: profile.email,
        };
    }

    const id = generateUserId();
    await db
        .prepare(
            `INSERT INTO users (id, github_id, github_login, name, avatar_url, email)
       VALUES (?, ?, ?, ?, ?, ?)`,
        )
        .bind(id, profile.id, profile.login, profile.name, profile.avatar_url, profile.email)
        .run();

    return {
        id,
        github_id: profile.id,
        github_login: profile.login,
        name: profile.name,
        avatar_url: profile.avatar_url,
        email: profile.email,
    };
}
