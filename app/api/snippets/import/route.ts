import type { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getRequestAuth } from '@/lib/auth/request';
import {
    importUserSnippets,
    SNIPPETS_IMPORT_LIMIT,
    type CreateSnippetInput,
} from '@/lib/snippets';


function jsonError(error: string, status: number) {
    return Response.json({ error }, { status });
}

async function requireSnippetUser(request: NextRequest) {
    const auth = await getRequestAuth(request);
    if (auth.error) {
        return { response: jsonError('Database unavailable', 503), user: null };
    }
    if (!auth.user) {
        return { response: jsonError('Authentication required', 401), user: null };
    }
    return { response: null, user: auth.user };
}

export async function POST(request: NextRequest) {
    const { response, user } = await requireSnippetUser(request);
    if (response || !user) return response;

    let payload: { snippets?: CreateSnippetInput[] } | null = null;
    try {
        payload = (await request.json()) as { snippets?: CreateSnippetInput[] };
    } catch {
        return jsonError('Invalid JSON body', 400);
    }

    if (!payload || !Array.isArray(payload.snippets)) {
        return jsonError('Snippets import payload must include a snippets array', 400);
    }

    if (payload.snippets.length > SNIPPETS_IMPORT_LIMIT) {
        return jsonError(`Snippets import must contain ${SNIPPETS_IMPORT_LIMIT} items or less`, 400);
    }

    try {
        const db = getDb();
        const result = await importUserSnippets(db, user.id, payload.snippets);
        return Response.json(result, { status: 200 });
    } catch {
        return jsonError('Failed to import snippets', 500);
    }
}