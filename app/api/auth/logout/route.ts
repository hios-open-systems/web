import { requireSameOrigin } from '@/lib/httpSecurity';
import { NextResponse, type NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { SESSION_COOKIE, deleteSession } from '@/lib/auth/session';


export async function POST(request: NextRequest) {
    const denied = requireSameOrigin(request);
    if (denied) return denied;
    const sessionId = request.cookies.get(SESSION_COOKIE)?.value;

    if (sessionId) {
        try {
            const db = getDb();
            await deleteSession(db, sessionId);
        } catch (error) {
            // No es fatal: igual limpiamos la cookie.
            console.error('Logout falló al borrar sesión en DB', error);
        }
    }

    const response = NextResponse.redirect(new URL('/', request.url), 303);
    response.cookies.delete(SESSION_COOKIE);
    return response;
}
