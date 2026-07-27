import type { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { isOwner } from '@/lib/auth/owner';
import { getRequestAuth } from '@/lib/auth/request';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getRequestAuth(request);
  if (auth.error) {
    return Response.json({ error: 'Database unavailable' }, { status: 503 });
  }
  if (!auth.user) {
    return Response.json({ error: 'Authentication required' }, { status: 401 });
  }
  if (!isOwner(auth.user)) {
    return Response.json({ error: 'Owner only' }, { status: 403 });
  }

  const { id } = await params;
  if (!id || typeof id !== 'string') {
    return Response.json({ error: 'invalid_id' }, { status: 400 });
  }

  try {
    const db = getDb();
    await db.prepare(`UPDATE guestbook SET status = 'hidden' WHERE id = ?`).bind(id).run();
  } catch {
    return Response.json({ error: 'update_failed' }, { status: 500 });
  }

  return Response.json({ ok: true });
}
