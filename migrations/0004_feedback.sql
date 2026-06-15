-- User-submitted feedback (anonymous OK). Low-PII: email is optional and only
-- for the owner to reply. The read side is the admin inbox (auth required).
CREATE TABLE IF NOT EXISTS feedback (
  id          TEXT PRIMARY KEY,
  user_id     TEXT REFERENCES users(id) ON DELETE SET NULL,
  kind        TEXT NOT NULL,                 -- bug | idea | note
  rating      INTEGER,                       -- 1..5, optional
  message     TEXT NOT NULL,
  email       TEXT,                          -- optional, to reply
  tool_slug   TEXT,
  path        TEXT,
  locale      TEXT,
  url         TEXT,
  ua          TEXT,
  referer     TEXT,
  cf_ray      TEXT,
  country     TEXT,
  build_id    TEXT,
  status      TEXT NOT NULL DEFAULT 'new',    -- new | read | archived
  created_at  INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_feedback_created ON feedback (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_kind ON feedback (kind);
CREATE INDEX IF NOT EXISTS idx_feedback_tool ON feedback (tool_slug);
