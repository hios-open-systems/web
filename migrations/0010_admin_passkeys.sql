-- Passkey (WebAuthn) step-up for the owner's admin pages. Keep in sync with lib/admin/schema.ts.
CREATE TABLE IF NOT EXISTS admin_passkeys (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL, public_key TEXT NOT NULL, counter INTEGER NOT NULL,
  transports TEXT NOT NULL, created_at INTEGER NOT NULL, last_used_at INTEGER);
CREATE TABLE IF NOT EXISTS admin_challenges (
  id TEXT PRIMARY KEY, session_id TEXT NOT NULL, kind TEXT NOT NULL, challenge TEXT NOT NULL, expires_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS admin_sessions (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL, session_id TEXT NOT NULL, expires_at INTEGER NOT NULL);
