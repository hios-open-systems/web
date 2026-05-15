import type { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getPublicSnippetById } from '@/lib/snippets';

export const runtime = 'edge';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    try {
        const db = getDb();
        const snippet = await getPublicSnippetById(db, id);
        if (!snippet) {
            return Response.json({ error: 'Snippet not found' }, { status: 404 });
        }
        return Response.json({ snippet }, { status: 200 });
    } catch {
        return Response.json({ error: 'Failed to load snippet' }, { status: 500 });
    }
}