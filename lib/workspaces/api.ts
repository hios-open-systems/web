import { requireSameOrigin, readJsonBody } from '@/lib/httpSecurity';
import type { D1Database } from '@cloudflare/workers-types';
import type { NextRequest } from 'next/server';
import { getRequestAuth } from '@/lib/auth/request';
import { getDb } from '@/lib/db';
import { checkRateLimit } from '@/lib/requestRateLimit';
import { validDocument, type StoredDocument } from './model';

interface Row { id: string; body: string; revision: number; deleted: number }

const CREATE_WORKSPACE_TABLE_SQL = `CREATE TABLE IF NOT EXISTS workspace_documents (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK(kind IN ('workspaces', 'presets')),
  id TEXT NOT NULL,
  body TEXT NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1,
  deleted INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, kind, id)
)`;

async function withWorkspaceTable<T>(db: D1Database, op: () => Promise<T>): Promise<T> {
  try {
    return await op();
  } catch (err) {
    if (String(err).includes('no such table')) {
      await db.prepare(CREATE_WORKSPACE_TABLE_SQL).run();
      return await op();
    }
    throw err;
  }
}

export async function documentsApi(request: NextRequest, kind: StoredDocument['kind']) {
  if (request.method !== 'GET') {
    const denied = requireSameOrigin(request);
    if (denied) return denied;
  }
  const auth = await getRequestAuth(request);
  if (auth.error) return Response.json({ error: 'unavailable' }, { status: 503 });
  if (!auth.user) return Response.json({ error: 'unauthorized' }, { status: 401 });
  const userId = auth.user.id;
  let db: D1Database;
  try { db = getDb(); } catch { return Response.json({ error: 'unavailable' }, { status: 503 }); }

  if (request.method === 'GET') {
    try {
      const rows = await withWorkspaceTable(db, () =>
        db.prepare('SELECT id, body, revision, deleted FROM workspace_documents WHERE user_id = ? AND kind = ?')
          .bind(userId, kind).all<Row>(),
      );
      return Response.json(
        { records: rows.results.map(row => ({ id: row.id, kind, document: JSON.parse(row.body), revision: row.revision, deleted: !!row.deleted, dirty: false })) },
        { headers: { 'Cache-Control': 'no-store' } },
      );
    } catch {
      return Response.json({ error: 'unavailable' }, { status: 503 });
    }
  }
  const limited = await checkRateLimit(request, 'workspace-write', { limit: 120, windowMs: 60_000 });
  if (limited) return limited;
  let payload: StoredDocument;
  try { payload = await readJsonBody(request, 1_100_000) as StoredDocument; } catch (error) {
    if (error instanceof Response) return error;
    return Response.json({ error: 'invalid' }, { status: 400 });
  }
  if (!payload || !validDocument(payload.document, kind) || payload.id !== payload.document.id
    || !Number.isSafeInteger(payload.revision) || payload.revision < 0 || (payload.deleted !== undefined && typeof payload.deleted !== 'boolean')) {
    return Response.json({ error: 'invalid' }, { status: 400 });
  }
  if ('syncContent' in payload.document && !payload.document.syncContent && payload.document.content) return Response.json({ error: 'content_not_authorized' }, { status: 400 });
  const body = JSON.stringify(payload.document);
  const revision = payload.revision + 1;
  try {
    const result = await withWorkspaceTable(db, () => {
      const query = payload.revision === 0
        ? db.prepare('INSERT OR IGNORE INTO workspace_documents (user_id,kind,id,body,revision,deleted,updated_at) VALUES (?,?,?,?,1,?,?)').bind(userId, kind, payload.id, body, Number(!!payload.deleted), Date.now())
        : db.prepare('UPDATE workspace_documents SET body=?,revision=?,deleted=?,updated_at=? WHERE user_id=? AND kind=? AND id=? AND revision=?').bind(body, revision, Number(!!payload.deleted), Date.now(), userId, kind, payload.id, payload.revision);
      return query.run();
    });
    if (!result.meta.changes) return Response.json({ error: 'conflict' }, { status: 409 });
    return Response.json({ revision });
  } catch {
    return Response.json({ error: 'unavailable' }, { status: 503 });
  }
}
