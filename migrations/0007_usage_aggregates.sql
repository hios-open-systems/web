-- Replace event-level analytics with daily counts. No user/request fields survive.
-- Legacy counts retain version=1: their original coverage/quality cannot be repaired.
CREATE TABLE IF NOT EXISTS usage_daily (
  day TEXT NOT NULL,
  event_name TEXT NOT NULL CHECK (event_name IN ('page_view','tool_open','search_select','preset_open','workspace_open','handoff_complete','export_generated')),
  path TEXT NOT NULL,
  locale TEXT NOT NULL,
  tool_id TEXT NOT NULL,
  version INTEGER NOT NULL CHECK (version IN (1,2)),
  count INTEGER NOT NULL CHECK (count > 0),
  PRIMARY KEY (day, event_name, path, locale, tool_id, version)
) WITHOUT ROWID;

INSERT INTO usage_daily (day, event_name, path, locale, tool_id, version, count)
SELECT date(created_at, 'unixepoch'),
  CASE event_name WHEN 'search_open' THEN 'search_select' WHEN 'preset_reuse' THEN 'preset_open' ELSE event_name END,
  '/legacy', CASE WHEN locale IN ('en','es','de','it') THEN locale ELSE '' END,
  CASE WHEN tool_id IN ('tone-generator', 'guitar-tuner', 'spectrum-analyzer', 'level-meter', 'metronome', 'beat-counter', 'delay-calculator', 'payload', 'type-checker', 'jwt-decode', 'dns-lookup', 'subnet-calculator', 'whois-rdap', 'certificate-check', 'hash-digest', 'object-to-types', 'random-string', 'encoder', 'uuid-ulid', 'object-compare', 'regex', 'text-diff', 'mermaid', 'excalidraw', 'site-checker', 'snippets', 'notes', 'patterns', 'cron', 'color', 'timestamp', 'number-base', 'json-schema', 'url-parser', 'image-base64', 'resistor-color-code', 'ohms-law', 'http-status-codes', 'ascii-unicode', 'note-frequency', 'chiptune', 'audio-convert', 'jam-station', 'beatmaker', 'image-convert', 'ipv6-expand', 'hmac', 'csv-json', 'llm-vram-calc', 'esp32-llm-bridge', 'voice-ai-latency', 'llm-grammar-generator', 'token-inspector', 'serial-monitor', 'qpsk-modulator', 'embedded') THEN tool_id ELSE '' END,
  1, COUNT(*)
FROM usage_events
WHERE date(created_at, 'unixepoch') BETWEEN date('now', '-89 days') AND date('now')
  AND event_name IN ('page_view','tool_open','search_open','preset_reuse','workspace_open','handoff_complete')
GROUP BY 1,2,3,4,5
ON CONFLICT(day, event_name, path, locale, tool_id, version) DO UPDATE SET count = count + excluded.count;
DROP TABLE usage_events;

-- Each nonce belongs to one event, never a browser/user/session. No dimensions
-- or precise timestamp are stored here. Current and previous UTC day only.
CREATE TABLE IF NOT EXISTS usage_receipts (id TEXT PRIMARY KEY, day TEXT NOT NULL) WITHOUT ROWID;
CREATE INDEX IF NOT EXISTS idx_usage_receipts_day ON usage_receipts(day);
CREATE TRIGGER IF NOT EXISTS usage_receipt_retention AFTER INSERT ON usage_receipts
BEGIN
  DELETE FROM usage_receipts WHERE day < date('now', '-1 day');
  DELETE FROM usage_daily WHERE day < date('now', '-89 days');
END;
