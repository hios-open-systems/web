import { NextResponse, type NextRequest } from 'next/server';
import { googleConfigured, googleAuthorize, randomToken } from '@/lib/auth/google';
import { safeNextPath } from '@/lib/auth/github';
import { findSessionWithUser, SESSION_COOKIE } from '@/lib/auth/session';
import { saveGoogleTransaction } from '@/lib/auth/google-transaction';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  if (!googleConfigured()) return NextResponse.json({ error: 'google_unavailable' }, { status: 503 });
  // Do not accept prefetches or an initiation embedded in another site.
  if (request.headers.get('sec-fetch-site') === 'cross-site') return new NextResponse(null, { status: 403 });
  try {
    const db = getDb();
    const url = new URL(request.url);
    const linking = url.searchParams.get('mode') === 'link';
    const sessionId = request.cookies.get(SESSION_COOKIE)?.value;
    const current = sessionId ? await findSessionWithUser(db, sessionId) : null;
    if (linking && !current) return NextResponse.json({ error: 'login_required' }, { status: 401 });
    const id = randomToken(), nonce = randomToken(), verifier = randomToken();
    const authorize = await googleAuthorize(id, nonce, verifier);
    await saveGoogleTransaction(db, { id, nonce, verifier, next_path: safeNextPath(url.searchParams.get('next')),
      user_id: linking ? current!.user.id : null, session_id: linking ? sessionId! : null,
      expires_at: Math.floor(Date.now() / 1000) + 600 });
    const response = NextResponse.redirect(authorize);
    response.headers.set('Cache-Control', 'private, no-store');
    response.headers.set('Referrer-Policy', 'no-referrer');
    response.cookies.set('hios_google_state', id, { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 600 });
    return response;
  } catch { return NextResponse.json({ error: 'google_unavailable' }, { status: 503 }); }
}
