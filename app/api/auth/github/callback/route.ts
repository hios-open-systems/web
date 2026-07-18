import { NextResponse, type NextRequest } from 'next/server';
import { exchangeCodeForToken, fetchGithubProfile, safeNextPath } from '@/lib/auth/github';
import { getDb } from '@/lib/db';
import {
    SESSION_COOKIE,
    SESSION_TTL_SECONDS,
    createSession,
} from '@/lib/auth/session';
import { upsertUserFromGithub } from '@/lib/auth/users';


const STATE_COOKIE = 'hios_oauth_state';
const NEXT_COOKIE = 'hios_oauth_next';

function errorResponse(request: NextRequest, code: string) {
    const url = new URL('/', request.url);
    url.searchParams.set('auth_error', code);
    return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const stateParam = url.searchParams.get('state');
    const stateCookie = request.cookies.get(STATE_COOKIE)?.value;
    const nextCookie = request.cookies.get(NEXT_COOKIE)?.value;

    if (!code || !stateParam || !stateCookie || stateParam !== stateCookie) {
        return errorResponse(request, 'state_mismatch');
    }

    try {
        const accessToken = await exchangeCodeForToken(code);
        const profile = await fetchGithubProfile(accessToken);

        const db = getDb();
        const user = await upsertUserFromGithub(db, profile);
        const session = await createSession(db, user.id);

        const requestOrigin = new URL(request.url).origin;
        const target = new URL(safeNextPath(nextCookie), request.url);
        // Belt-and-suspenders: never leave our own origin post-login.
        if (target.origin !== requestOrigin) {
            target.href = `${requestOrigin}/`;
        }
        const response = NextResponse.redirect(target);

        response.cookies.set(SESSION_COOKIE, session.id, {
            httpOnly: true,
            sameSite: 'lax',
            secure: true,
            path: '/',
            maxAge: SESSION_TTL_SECONDS,
        });
        response.cookies.delete(STATE_COOKIE);
        response.cookies.delete(NEXT_COOKIE);

        return response;
    } catch (error) {
        console.error('GitHub OAuth callback failed', error);
        return errorResponse(request, 'callback_failed');
    }
}
