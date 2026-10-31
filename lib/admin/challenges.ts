import type { OwnerContext } from './context';
import { now, randomId } from './context';

export async function saveChallenge(ctx: OwnerContext, kind: 'register' | 'login', challenge: string) {
  await ctx.db.batch([
    ctx.db.prepare('DELETE FROM admin_challenges WHERE expires_at < ? OR (session_id = ? AND kind = ?)').bind(now(), ctx.sessionId, kind),
    ctx.db.prepare('INSERT INTO admin_challenges (id, session_id, kind, challenge, expires_at) VALUES (?, ?, ?, ?, ?)')
      .bind(randomId(), ctx.sessionId, kind, challenge, now() + 300),
  ]);
}

/** Single use: the challenge is deleted as it is read. */
export async function takeChallenge(ctx: OwnerContext, kind: 'register' | 'login'): Promise<string | null> {
  const row = await ctx.db.prepare('DELETE FROM admin_challenges WHERE session_id = ? AND kind = ? AND expires_at >= ? RETURNING challenge')
    .bind(ctx.sessionId, kind, now()).first<{ challenge: string }>();
  return row?.challenge ?? null;
}
