import { NextResponse, type NextRequest } from 'next/server';
import {
    buildGithubAuthorizeUrl,
    generateOAuthState,
} from '@/lib/auth/github';

export const runtime = 'edge';

const STATE_COOKIE = 'hios_oauth_state';
const NEXT_COOKIE = 'hios_oauth_next';
const STATE_TTL = 60 * 10; // 10 min

export async function GET(request: NextRequest) {
    const url = new URL(request.url);
    const next = url.searchParams.get('next');
    const safeNext = next && next.startsWith('/') ? next : '/';
    const state = generateOAuthState();

    const authorizeUrl = buildGithubAuthorizeUrl(state, safeNext);
    const response = NextResponse.redirect(authorizeUrl);

    response.cookies.set(STATE_COOKIE, state, {
        httpOnly: true,
        sameSite: 'lax',
        secure: true,
        path: '/',
        maxAge: STATE_TTL,
    });
    response.cookies.set(NEXT_COOKIE, safeNext, {
        httpOnly: true,
        sameSite: 'lax',
        secure: true,
        path: '/',
        maxAge: STATE_TTL,
    });

    return response;
}
