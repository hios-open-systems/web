import { NextResponse, type NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { SESSION_COOKIE, deleteSession } from '@/lib/auth/session';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
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

    const response = NextResponse.redirect(new URL('/', request.url));
    response.cookies.delete(SESSION_COOKIE);
    return response;
}

// Permitir GET para hacerlo trivial de invocar desde un link, sólo si querés.
// Si te molesta la seguridad de logout-por-GET (CSRF para logout es bajo riesgo
// pero molesto), comentá esto y forzá POST desde un form.
export async function GET(request: NextRequest) {
    return POST(request);
}
