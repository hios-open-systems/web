/**
 * OAuth GitHub handroll. Sin dependencias externas, fácil de leer.
 * Necesita GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET y AUTH_BASE_URL en env.
 */

export interface GithubProfile {
    id: number;
    login: string;
    name: string | null;
    avatar_url: string | null;
    email: string | null;
}

export const GITHUB_SCOPE = 'read:user user:email';

export function getGithubClientId(): string {
    const value = process.env.GITHUB_CLIENT_ID;
    if (!value) throw new Error('Falta GITHUB_CLIENT_ID en env');
    return value;
}

export function getGithubClientSecret(): string {
    const value = process.env.GITHUB_CLIENT_SECRET;
    if (!value) throw new Error('Falta GITHUB_CLIENT_SECRET en env');
    return value;
}

export function getAuthBaseUrl(): string {
    const value = process.env.AUTH_BASE_URL;
    if (!value) throw new Error('Falta AUTH_BASE_URL en env (ej. https://openhios.dev)');
    return value.replace(/\/$/, '');
}

export function getCallbackUrl(): string {
    return `${getAuthBaseUrl()}/api/auth/github/callback`;
}

/**
 * Sanitiza un destino post-login. Solo permite rutas internas absolutas.
 * Rechaza protocol-relative (`//host`) y el truco de backslash (`/\host`),
 * que `startsWith('/')` dejaba pasar y `new URL()` resolvía a otro dominio.
 */
export function safeNextPath(value: string | null | undefined): string {
    if (!value || value[0] !== '/') return '/';
    const second = value[1];
    if (second === '/' || second === '\\') return '/';
    return value;
}

export function generateOAuthState(): string {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function buildGithubAuthorizeUrl(state: string, redirectTo: string): string {
    const params = new URLSearchParams({
        client_id: getGithubClientId(),
        redirect_uri: getCallbackUrl(),
        scope: GITHUB_SCOPE,
        state,
        allow_signup: 'true',
    });
    // Mantenemos el `redirectTo` interno dentro del state? Mejor: lo guardamos en una cookie hermana
    // (ver start route). Acá sólo armamos la URL.
    void redirectTo;
    return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

export async function exchangeCodeForToken(code: string): Promise<string> {
    const res = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            client_id: getGithubClientId(),
            client_secret: getGithubClientSecret(),
            code,
            redirect_uri: getCallbackUrl(),
        }),
    });

    if (!res.ok) {
        throw new Error(`GitHub token exchange falló: ${res.status}`);
    }

    const data = (await res.json()) as { access_token?: string; error?: string };
    if (!data.access_token) {
        throw new Error(`GitHub token exchange sin access_token: ${data.error ?? 'desconocido'}`);
    }
    return data.access_token;
}

export async function fetchGithubProfile(accessToken: string): Promise<GithubProfile> {
    const userRes = await fetch('https://api.github.com/user', {
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'User-Agent': 'openhios.dev',
            Accept: 'application/vnd.github+json',
        },
    });
    if (!userRes.ok) {
        throw new Error(`No se pudo leer /user de GitHub: ${userRes.status}`);
    }
    const user = (await userRes.json()) as {
        id: number;
        login: string;
        name: string | null;
        avatar_url: string | null;
        email: string | null;
    };

    // /user solo trae email si es público. Si vino null, vamos a /user/emails y elegimos el primario.
    let email = user.email;
    if (!email) {
        const emailsRes = await fetch('https://api.github.com/user/emails', {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'User-Agent': 'openhios.dev',
                Accept: 'application/vnd.github+json',
            },
        });
        if (emailsRes.ok) {
            const emails = (await emailsRes.json()) as Array<{
                email: string;
                primary: boolean;
                verified: boolean;
            }>;
            const primary = emails.find((e) => e.primary && e.verified) ?? emails[0];
            email = primary?.email ?? null;
        }
    }

    return {
        id: user.id,
        login: user.login,
        name: user.name,
        avatar_url: user.avatar_url,
        email,
    };
}
