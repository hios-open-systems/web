import type { NextRequest } from 'next/server';
import { getRequestAuth } from '@/lib/auth/request';
import { getDb } from '@/lib/db';
import { checkRateLimit } from '@/lib/rateLimit';
import { validDocument, type StoredDocument } from './model';

interface Row { id: string; body: string; revision: number; deleted: number }
export async function documentsApi(request: NextRequest, kind: StoredDocument['kind']) {
  const auth = await getRequestAuth(request);
  if (auth.error) return Response.json({ error: 'unavailable' }, { status: 503 });
  if (!auth.user) return Response.json({ error: 'unauthorized' }, { status: 401 });
  const db = getDb();
  if (request.method === 'GET') {
    const rows = await db.prepare('SELECT id, body, revision, deleted FROM workspace_documents WHERE user_id = ? AND kind = ?')
      .bind(auth.user.id, kind).all<Row>();
    return Response.json({ records: rows.results.map(row => ({ id: row.id, kind, document: JSON.parse(row.body), revision: row.revision, deleted: !!row.deleted, dirty: false })) }, { headers: { 'Cache-Control': 'no-store' } });
  }
  if (request.headers.get('origin') !== request.nextUrl.origin) return Response.json({ error: 'origin' }, { status: 403 });
  const limited = checkRateLimit(request, 'workspace-write', { limit: 120, windowMs: 60_000 });
  if (limited) return limited;
  const text = await request.text();
  if (new TextEncoder().encode(text).length > 1_100_000) return Response.json({ error: 'too_large' }, { status: 413 });
  let payload: StoredDocument;
  try { payload = JSON.parse(text) as StoredDocument; } catch { return Response.json({ error: 'invalid' }, { status: 400 }); }
  if (!payload || !validDocument(payload.document, kind) || payload.id !== payload.document.id
    || !Number.isSafeInteger(payload.revision) || payload.revision < 0 || (payload.deleted !== undefined && typeof payload.deleted !== 'boolean')) {
    return Response.json({ error: 'invalid' }, { status: 400 });
  }
  if ('syncContent' in payload.document && !payload.document.syncContent && payload.document.content) return Response.json({ error: 'content_not_authorized' }, { status: 400 });
  const body = JSON.stringify(payload.document);
  const revision = payload.revision + 1;
  const query = payload.revision === 0
    ? db.prepare('INSERT OR IGNORE INTO workspace_documents (user_id,kind,id,body,revision,deleted,updated_at) VALUES (?,?,?,?,1,?,?)').bind(auth.user.id, kind, payload.id, body, Number(!!payload.deleted), Date.now())
    : db.prepare('UPDATE workspace_documents SET body=?,revision=?,deleted=?,updated_at=? WHERE user_id=? AND kind=? AND id=? AND revision=?').bind(body, revision, Number(!!payload.deleted), Date.now(), auth.user.id, kind, payload.id, payload.revision);
  const result = await query.run();
  if (!result.meta.changes) return Response.json({ error: 'conflict' }, { status: 409 });
  return Response.json({ revision });
}
