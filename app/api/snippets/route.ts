import type { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getRequestAuth } from '@/lib/auth/request';
import {
    createUserSnippet,
    listUserSnippets,
    type CreateSnippetInput,
    validateCreateSnippetInput,
} from '@/lib/snippets';

export const runtime = 'edge';

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

export async function GET(request: NextRequest) {
    const { response, user } = await requireSnippetUser(request);
    if (response || !user) return response;

    try {
        const db = getDb();
        const snippets = await listUserSnippets(db, user.id);
        return Response.json({ snippets }, { status: 200 });
    } catch {
        return jsonError('Failed to load snippets', 500);
    }
}

export async function POST(request: NextRequest) {
    const { response, user } = await requireSnippetUser(request);
    if (response || !user) return response;

    let payload: CreateSnippetInput | null = null;
    try {
        payload = (await request.json()) as CreateSnippetInput;
    } catch {
        return jsonError('Invalid JSON body', 400);
    }

    if (!payload || typeof payload !== 'object') {
        return jsonError('Invalid snippet payload', 400);
    }

    const validationError = validateCreateSnippetInput(payload);
    if (validationError) {
        return jsonError(validationError, 400);
    }

    try {
        const db = getDb();
        const snippet = await createUserSnippet(db, user.id, payload);
        return Response.json({ snippet }, { status: 201 });
    } catch {
        return jsonError('Failed to create snippet', 500);
    }
}