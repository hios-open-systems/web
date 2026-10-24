-- Preserve internal IDs and every dependent row while relaxing GitHub-only fields.
-- D1 runs a migration atomically. Keep FK enforcement on: DROP users cascades,
-- so dependent rows are snapshotted and restored within the same migration.
PRAGMA defer_foreign_keys = ON;
CREATE TABLE auth_backup_sessions AS SELECT * FROM sessions;
CREATE TABLE auth_backup_snippets AS SELECT * FROM snippets;
CREATE TABLE auth_backup_settings AS SELECT * FROM user_settings;
CREATE TABLE auth_backup_workspaces AS SELECT * FROM workspace_documents;
CREATE TABLE auth_backup_feedback AS SELECT id, user_id FROM feedback;
CREATE TABLE users_new (
  id TEXT PRIMARY KEY,
  github_id INTEGER UNIQUE,
  github_login TEXT,
  name TEXT,
  avatar_url TEXT,
  email TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
INSERT INTO users_new SELECT * FROM users;
DROP TABLE users;
ALTER TABLE users_new RENAME TO users;
INSERT INTO sessions SELECT * FROM auth_backup_sessions;
INSERT INTO snippets SELECT * FROM auth_backup_snippets;
INSERT INTO user_settings SELECT * FROM auth_backup_settings;
INSERT INTO workspace_documents SELECT * FROM auth_backup_workspaces;
UPDATE feedback SET user_id = (SELECT user_id FROM auth_backup_feedback WHERE id = feedback.id);
DROP TABLE auth_backup_sessions;
DROP TABLE auth_backup_snippets;
DROP TABLE auth_backup_settings;
DROP TABLE auth_backup_workspaces;
DROP TABLE auth_backup_feedback;

CREATE TABLE auth_identities (
  provider TEXT NOT NULL CHECK (provider IN ('github', 'google')),
  subject TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (provider, subject),
  UNIQUE (user_id, provider)
);
INSERT INTO auth_identities (provider, subject, user_id)
SELECT 'github', CAST(github_id AS TEXT), id FROM users WHERE github_id IS NOT NULL;
CREATE TABLE oauth_transactions (
  id TEXT PRIMARY KEY,
  nonce TEXT NOT NULL,
  verifier TEXT NOT NULL,
  next_path TEXT NOT NULL,
  session_id TEXT REFERENCES sessions(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);
CREATE INDEX idx_oauth_expiry ON oauth_transactions(expires_at);
PRAGMA defer_foreign_keys = OFF;
