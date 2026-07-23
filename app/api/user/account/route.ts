import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getRequestAuth } from '@/lib/auth/request';
import { SESSION_COOKIE } from '@/lib/auth/session';
import { getDb } from '@/lib/db';
import { checkRateLimit } from '@/lib/rateLimit';

/**
 * DELETE /api/user/account — borrado total de la cuenta y sus datos.
 *
 * El esquema hace casi todo el trabajo: borrar la fila de users cascadea
 * sessions, snippets y user_settings (ON DELETE CASCADE) y anonimiza
 * usage_events y feedback (ON DELETE SET NULL). No queda nada asociable
 * al usuario. Irreversible a propósito — es el botón "borrá todo lo mío"
 * de Settings → Datos y privacidad.
 */
export async function DELETE(request: NextRequest) {
    const limited = checkRateLimit(request, 'account-delete', { limit: 3, windowMs: 60_000 });
    if (limited) return limited;

    const auth = await getRequestAuth(request);
    if (auth.error) {
        return Response.json({ error: 'Database unavailable' }, { status: 503 });
    }
    if (!auth.user) {
        return Response.json({ error: 'Authentication required' }, { status: 401 });
    }

    try {
        const db = getDb();
        await db.prepare('DELETE FROM users WHERE id = ?').bind(auth.user.id).run();
    } catch (error) {
        console.error('Account deletion failed', error);
        return Response.json({ error: 'Deletion failed' }, { status: 500 });
    }

    const response = NextResponse.json({ deleted: true });
    response.cookies.delete(SESSION_COOKIE);
    return response;
}
