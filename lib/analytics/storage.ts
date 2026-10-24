import type { D1Database } from '@cloudflare/workers-types';
import type { DailyUsage, UsageEvent } from './model.ts';

/** Atomic batch: a repeated event nonce cannot increment a second time. */
export async function recordUsage(db: D1Database, event: UsageEvent): Promise<void> {
  await db.batch([
    db.prepare(`INSERT INTO usage_daily (day, event_name, path, locale, tool_id, version, count)
      SELECT date('now'), ?, ?, ?, ?, 2, 1 WHERE NOT EXISTS (SELECT 1 FROM usage_receipts WHERE id = ?)
      ON CONFLICT(day, event_name, path, locale, tool_id, version) DO UPDATE SET count = count + 1`)
      .bind(event.eventName, event.path, event.locale, event.toolId, event.eventId),
    db.prepare("INSERT OR IGNORE INTO usage_receipts (id, day) VALUES (?, date('now'))").bind(event.eventId),
  ]);
}

export async function readUsage(db: D1Database, from: string, to: string, locale: string | null = null): Promise<DailyUsage[]> {
  const result = await db.prepare(`SELECT day, event_name, path, locale, tool_id, version, count
    FROM usage_daily WHERE day >= ? AND day <= ? AND (? IS NULL OR locale = ?)`)
    .bind(from, to, locale, locale).all<DailyUsage>();
  return result.results;
}

/** Daily Cron plus ingestion triggers remove expired active-table data. */
export async function pruneUsage(db: D1Database): Promise<void> {
  await db.batch([
    db.prepare("DELETE FROM usage_receipts WHERE day < date('now', '-1 day')"),
    db.prepare("DELETE FROM usage_daily WHERE day < date('now', '-89 days')"),
  ]);
}
