CREATE TABLE IF NOT EXISTS guestbook (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  message     TEXT NOT NULL,
  country     TEXT,
  ua          TEXT,
  cf_ray      TEXT,
  status      TEXT NOT NULL DEFAULT 'visible',
  created_at  INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_guestbook_created ON guestbook (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_guestbook_status ON guestbook (status);
