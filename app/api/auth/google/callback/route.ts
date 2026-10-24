import { NextResponse, type NextRequest } from 'next/server';
import { exchangeGoogle, googleConfigured } from '@/lib/auth/google';
import { consumeGoogleTransaction } from '@/lib/auth/google-transaction';
import { resolveGoogleUser } from '@/lib/auth/identities';
import { safeNextPath } from '@/lib/auth/github';
import { createSession, findSessionWithUser, SESSION_COOKIE, SESSION_TTL_SECONDS } from '@/lib/auth/session';
import { getDb } from '@/lib/db';

function finish(target: URL, sessionId?: string) {
  const response = NextResponse.redirect(target);
  response.cookies.delete('hios_google_state');
  response.headers.set('Cache-Control', 'private, no-store');
  response.headers.set('Referrer-Policy', 'no-referrer');
  if (sessionId) response.cookies.set(SESSION_COOKIE, sessionId,
    { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: SESSION_TTL_SECONDS });
  return response;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url), state = url.searchParams.get('state');
  let next = '/';
  try {
    if (!googleConfigured() || !state || state !== request.cookies.get('hios_google_state')?.value) throw new Error('Invalid state');
    const db = getDb();
    const transaction = await consumeGoogleTransaction(db, state);
    if (!transaction) throw new Error('Expired state');
    next = safeNextPath(transaction.next_path);
    const code = url.searchParams.get('code');
    if (!code) throw new Error('Denied');
    if (transaction.user_id) {
      const sessionId = request.cookies.get(SESSION_COOKIE)?.value;
      const current = sessionId ? await findSessionWithUser(db, sessionId) : null;
      if (sessionId !== transaction.session_id || current?.user.id !== transaction.user_id) throw new Error('Session changed');
    }
    const profile = await exchangeGoogle(code, transaction.verifier, transaction.nonce);
    const user = await resolveGoogleUser(db, profile, transaction.user_id);
    const session = await createSession(db, user.id);
    return finish(new URL(next, url.origin), session.id);
  } catch {
    const target = new URL(next, url.origin);
    target.searchParams.set('auth_error', 'google_failed');
    return finish(target);
  }
}
