import type { UserRow } from '@/lib/auth/session';

// Immutable GitHub ID of juanjparedez, verified via api.github.com/users/juanjparedez.
const DEFAULT_OWNER_ID = '37183343';

export function isOwner(user: Pick<UserRow, 'github_id'> | null | undefined): boolean {
    // Forks using the old login override must explicitly configure an ID.
    const configured = process.env.ADMIN_GITHUB_ID ?? (process.env.ADMIN_GITHUB_LOGIN ? '' : DEFAULT_OWNER_ID);
    return /^[1-9]\d*$/.test(configured) && Number.isSafeInteger(Number(configured))
        && user?.github_id === Number(configured);
}
