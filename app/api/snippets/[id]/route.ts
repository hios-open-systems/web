import type { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getRequestAuth } from '@/lib/auth/request';
import {
    deleteUserSnippet,
    updateUserSnippet,
    type UpdateSnippetInput,
    validateUpdateSnippetInput,
} from '@/lib/snippets';


interface RouteProps {
    params: Promise<{ id: string }>;
}

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

export async function PATCH(request: NextRequest, { params }: RouteProps) {
    const { response, user } = await requireSnippetUser(request);
    if (response || !user) return response;

    const { id } = await params;
    let payload: UpdateSnippetInput | null = null;
    try {
        payload = (await request.json()) as UpdateSnippetInput;
    } catch {
        return jsonError('Invalid JSON body', 400);
    }

    if (!payload || typeof payload !== 'object') {
        return jsonError('Invalid snippet payload', 400);
    }

    const validationError = validateUpdateSnippetInput(payload);
    if (validationError) {
        return jsonError(validationError, 400);
    }

    try {
        const db = getDb();
        const snippet = await updateUserSnippet(db, user.id, id, payload);
        if (!snippet) {
            return jsonError('Snippet not found', 404);
        }
        return Response.json({ snippet }, { status: 200 });
    } catch {
        return jsonError('Failed to update snippet', 500);
    }
}

export async function DELETE(request: NextRequest, { params }: RouteProps) {
    const { response, user } = await requireSnippetUser(request);
    if (response || !user) return response;

    const { id } = await params;

    try {
        const db = getDb();
        const deleted = await deleteUserSnippet(db, user.id, id);
        if (!deleted) {
            return jsonError('Snippet not found', 404);
        }
        return new Response(null, { status: 204 });
    } catch {
        return jsonError('Failed to delete snippet', 500);
    }
}