import type { D1Database } from '@cloudflare/workers-types';
import type { UserRow } from './session';

export async function resolveGoogleUser(db: D1Database, profile: { sub: string; name: string | null }, linkUser: string | null): Promise<UserRow> {
  const id = linkUser ?? 'u_' + crypto.randomUUID().replaceAll('-', '');
  const statements = linkUser ? [] : [db.prepare(
    "INSERT INTO users (id, name) SELECT ?, ? WHERE NOT EXISTS (SELECT 1 FROM auth_identities WHERE provider = 'google' AND subject = ?)",
  ).bind(id, profile.name, profile.sub)];
  statements.push(db.prepare(
    "INSERT OR IGNORE INTO auth_identities (provider, subject, user_id) SELECT 'google', ?, id FROM users WHERE id = ?",
  ).bind(profile.sub, id));
  await db.batch(statements);
  const user = await db.prepare(
    "SELECT u.* FROM users u JOIN auth_identities i ON i.user_id = u.id WHERE i.provider = 'google' AND i.subject = ?",
  ).bind(profile.sub).first<UserRow>();
  if (!user || (linkUser && user.id !== linkUser)) throw new Error('Identity already linked');
  return user;
}
