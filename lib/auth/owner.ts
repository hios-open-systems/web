/**
 * Owner gating: el sitio tiene un solo administrador (el dueño del repo).
 *
 * No hay tabla de roles — el "rol admin" es simplemente que tu login de GitHub
 * coincida con el del dueño. Overrideable por env (ADMIN_GITHUB_LOGIN) para
 * forks: quien clone el proyecto pone el suyo sin tocar código.
 */

import type { UserRow } from '@/lib/auth/session';

const DEFAULT_OWNER_LOGIN = 'juanjparedez';

export function getOwnerLogin(): string {
    return (process.env.ADMIN_GITHUB_LOGIN || DEFAULT_OWNER_LOGIN).toLowerCase();
}

export function isOwner(user: Pick<UserRow, 'github_login'> | null | undefined): boolean {
    if (!user?.github_login) return false;
    return user.github_login.toLowerCase() === getOwnerLogin();
}
