-- Registro básico de actividad de uso (privacy-first): navegación y apertura de tools.

CREATE TABLE IF NOT EXISTS usage_events (
  id           TEXT PRIMARY KEY,
  user_id      TEXT REFERENCES users(id) ON DELETE SET NULL,
  event_name   TEXT NOT NULL,
  path         TEXT NOT NULL,
  locale       TEXT,
  tool_id      TEXT,
  source       TEXT NOT NULL DEFAULT 'web',
  metadata     TEXT,
  ua           TEXT,
  referer      TEXT,
  cf_ray       TEXT,
  country      TEXT,
  created_at   INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_usage_events_created_at ON usage_events(created_at);
CREATE INDEX IF NOT EXISTS idx_usage_events_name       ON usage_events(event_name);
CREATE INDEX IF NOT EXISTS idx_usage_events_user       ON usage_events(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_events_path       ON usage_events(path);
