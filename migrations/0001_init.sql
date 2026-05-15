-- Schema inicial: usuarios, sesiones, snippets.
-- Idempotente: usa IF NOT EXISTS para que correrla dos veces no rompa.

CREATE TABLE IF NOT EXISTS users (
  id           TEXT PRIMARY KEY,
  github_id    INTEGER NOT NULL UNIQUE,
  github_login TEXT NOT NULL,
  name         TEXT,
  avatar_url   TEXT,
  email        TEXT,
  created_at   INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS sessions (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_sessions_user    ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS snippets (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  tags       TEXT,
  is_public  INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_snippets_user    ON snippets(user_id);
CREATE INDEX IF NOT EXISTS idx_snippets_public  ON snippets(is_public) WHERE is_public = 1;
