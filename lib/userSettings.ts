import type { D1Database } from '@cloudflare/workers-types';
import { DEFAULT_ACCENT, isValidHex, normalizeHex } from '@/lib/themes/config';

export const THEME_ACCENT_SETTING_KEY = 'theme_accent';

export interface UserSettings {
    themeAccent: string | null;
    updatedAt: number | null;
}

interface UserSettingRow {
    value: string;
    updated_at: number;
}

export interface UpdateUserSettingsInput {
    themeAccent?: string | null;
}

export function normalizeThemeAccent(value: string): string {
    return normalizeHex(value);
}

export function validateThemeAccent(value: string): string | null {
    if (!isValidHex(value)) {
        return 'Theme accent must be a valid hex color';
    }
    return null;
}

export async function getUserSettings(db: D1Database, userId: string): Promise<UserSettings> {
    const row = await db
        .prepare(
            `SELECT value, updated_at
             FROM user_settings
             WHERE user_id = ? AND key = ?
             LIMIT 1`,
        )
        .bind(userId, THEME_ACCENT_SETTING_KEY)
        .first<UserSettingRow>();

    if (!row) {
        return { themeAccent: null, updatedAt: null };
    }

    if (!isValidHex(row.value)) {
        return { themeAccent: null, updatedAt: row.updated_at };
    }

    return {
        themeAccent: normalizeThemeAccent(row.value),
        updatedAt: row.updated_at,
    };
}

export async function updateUserSettings(
    db: D1Database,
    userId: string,
    input: UpdateUserSettingsInput,
): Promise<UserSettings> {
    const now = Date.now();

    if ('themeAccent' in input) {
        if (input.themeAccent === null) {
            await db
                .prepare('DELETE FROM user_settings WHERE user_id = ? AND key = ?')
                .bind(userId, THEME_ACCENT_SETTING_KEY)
                .run();
        } else if (typeof input.themeAccent === 'string') {
            const normalizedAccent = normalizeThemeAccent(input.themeAccent);
            await db
                .prepare(
                    `INSERT INTO user_settings (user_id, key, value, updated_at)
                     VALUES (?, ?, ?, ?)
                     ON CONFLICT(user_id, key)
                     DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
                )
                .bind(userId, THEME_ACCENT_SETTING_KEY, normalizedAccent, now)
                .run();
        }
    }

    return getUserSettings(db, userId);
}

export function shouldOfferThemeImport(localAccent: string, remoteAccent: string | null): boolean {
    const normalizedLocal = normalizeThemeAccent(localAccent);
    if (remoteAccent) return false;
    return normalizedLocal !== DEFAULT_ACCENT;
}