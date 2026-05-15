import type { CreateSnippetInput, SnippetRecord } from '@/lib/snippets';

interface ErrorPayload {
    error?: string;
}

async function parseError(response: Response, fallback: string): Promise<string> {
    try {
        const payload = (await response.json()) as ErrorPayload;
        return payload.error || fallback;
    } catch {
        return fallback;
    }
}

export async function fetchRemoteSnippets(): Promise<SnippetRecord[]> {
    const response = await fetch('/api/snippets', { credentials: 'same-origin', cache: 'no-store' });
    if (!response.ok) {
        throw new Error(await parseError(response, 'Failed to load snippets'));
    }
    const payload = (await response.json()) as { snippets: SnippetRecord[] };
    return payload.snippets;
}

export async function createRemoteSnippet(input: CreateSnippetInput): Promise<SnippetRecord> {
    const response = await fetch('/api/snippets', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(input),
    });
    if (!response.ok) {
        throw new Error(await parseError(response, 'Failed to save snippet'));
    }
    const payload = (await response.json()) as { snippet: SnippetRecord };
    return payload.snippet;
}

export async function updateRemoteSnippet(snippetId: string, input: Partial<CreateSnippetInput>): Promise<SnippetRecord> {
    const response = await fetch(`/api/snippets/${snippetId}`, {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(input),
    });
    if (!response.ok) {
        throw new Error(await parseError(response, 'Failed to update snippet'));
    }
    const payload = (await response.json()) as { snippet: SnippetRecord };
    return payload.snippet;
}

export async function deleteRemoteSnippet(snippetId: string): Promise<void> {
    const response = await fetch(`/api/snippets/${snippetId}`, {
        method: 'DELETE',
        credentials: 'same-origin',
    });
    if (!response.ok) {
        throw new Error(await parseError(response, 'Failed to delete snippet'));
    }
}

export async function importRemoteSnippets(snippets: CreateSnippetInput[]): Promise<{ imported: number; skipped: number }> {
    const response = await fetch('/api/snippets/import', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ snippets }),
    });
    if (!response.ok) {
        throw new Error(await parseError(response, 'Failed to import snippets'));
    }
    const payload = (await response.json()) as { imported: number; skipped: number };
    return payload;
}