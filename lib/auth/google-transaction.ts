import type { D1Database } from '@cloudflare/workers-types';
export interface GoogleTransaction {
  id: string; nonce: string; verifier: string; next_path: string;
  session_id: string | null; user_id: string | null; expires_at: number;
}
export async function saveGoogleTransaction(db: D1Database, row: GoogleTransaction) {
  await db.batch([
    db.prepare('DELETE FROM oauth_transactions WHERE expires_at < ?').bind(Math.floor(Date.now() / 1000)),
    db.prepare('INSERT INTO oauth_transactions (id, nonce, verifier, next_path, session_id, user_id, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .bind(row.id, row.nonce, row.verifier, row.next_path, row.session_id, row.user_id, row.expires_at),
  ]);
}
export async function consumeGoogleTransaction(db: D1Database, id: string) {
  return db.prepare('DELETE FROM oauth_transactions WHERE id = ? AND expires_at > ? RETURNING *')
    .bind(id, Math.floor(Date.now() / 1000)).first<GoogleTransaction>();
}
