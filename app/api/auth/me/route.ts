import { NextResponse, type NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { isOwner } from '@/lib/auth/owner';
import { SESSION_COOKIE, findSessionWithUser } from '@/lib/auth/session';


export async function GET(request: NextRequest) {
    const sessionId = request.cookies.get(SESSION_COOKIE)?.value;
    if (!sessionId) {
        return NextResponse.json({ user: null });
    }

    try {
        const db = getDb();
        const result = await findSessionWithUser(db, sessionId);
        return NextResponse.json({
            user: result
                ? {
                    id: result.user.id,
                    login: result.user.github_login,
                    name: result.user.name,
                    avatar_url: result.user.avatar_url,
                    isOwner: isOwner(result.user),
                }
                : null,
        });
    } catch (error) {
        console.error('/api/auth/me failed', error);
        return NextResponse.json({ user: null });
    }
}
