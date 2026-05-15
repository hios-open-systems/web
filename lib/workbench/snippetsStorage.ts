import type { SnippetRecord } from '@/lib/snippets';

interface LocalPayload {
    version: 1;
    snippets: SnippetRecord[];
}

interface LegacySnippet {
    id: string;
    title: string;
    tags?: string[];
    body: string;
}

const LOCAL_STORAGE_KEY = 'hios-workbench-snippets';
const REMOTE_CACHE_PREFIX = 'hios-workbench-snippets-cache:';

function isSnippetRecord(value: unknown): value is SnippetRecord {
    if (!value || typeof value !== 'object') return false;
    const snippet = value as Record<string, unknown>;
    return (
        typeof snippet.id === 'string' &&
        typeof snippet.title === 'string' &&
        typeof snippet.body === 'string' &&
        Array.isArray(snippet.tags) &&
        snippet.tags.every((tag) => typeof tag === 'string') &&
        typeof snippet.isPublic === 'boolean' &&
        typeof snippet.createdAt === 'number' &&
        typeof snippet.updatedAt === 'number'
    );
}

function normalizeLegacySnippet(snippet: LegacySnippet): SnippetRecord | null {
    if (!snippet || typeof snippet !== 'object') return null;
    if (typeof snippet.id !== 'string' || typeof snippet.title !== 'string' || typeof snippet.body !== 'string') {
        return null;
    }

    const now = Date.now();
    return {
        id: snippet.id,
        title: snippet.title,
        body: snippet.body,
        tags: Array.isArray(snippet.tags)
            ? snippet.tags.filter((tag): tag is string => typeof tag === 'string')
            : [],
        isPublic: false,
        createdAt: now,
        updatedAt: now,
    };
}

function safeRead<T>(storageKey: string): T | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = window.localStorage.getItem(storageKey);
        return raw ? (JSON.parse(raw) as T) : null;
    } catch {
        return null;
    }
}

function safeWrite(storageKey: string, value: unknown) {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(storageKey, JSON.stringify(value));
    } catch {
        // localStorage lleno o bloqueado: no es fatal
    }
}

export function createSnippetDraft(input: { title: string; body: string; tags: string[] }): SnippetRecord {
    const now = Date.now();
    return {
        id: typeof crypto !== 'undefined' && 'randomUUID' in crypto
            ? crypto.randomUUID()
            : `${now}-${Math.floor(Math.random() * 1e9).toString(36)}`,
        title: input.title.trim(),
        body: input.body.trim(),
        tags: input.tags,
        isPublic: false,
        createdAt: now,
        updatedAt: now,
    };
}

export function readLocalSnippets(): SnippetRecord[] {
    const parsed = safeRead<LocalPayload | LegacySnippet[]>(LOCAL_STORAGE_KEY);
    if (!parsed) return [];

    if (Array.isArray(parsed)) {
        const migrated = parsed.map(normalizeLegacySnippet).filter((snippet): snippet is SnippetRecord => Boolean(snippet));
        writeLocalSnippets(migrated);
        return migrated;
    }

    if (
        parsed &&
        typeof parsed === 'object' &&
        parsed.version === 1 &&
        Array.isArray(parsed.snippets)
    ) {
        return parsed.snippets.filter(isSnippetRecord);
    }

    return [];
}

export function writeLocalSnippets(snippets: SnippetRecord[]) {
    safeWrite(LOCAL_STORAGE_KEY, { version: 1, snippets } satisfies LocalPayload);
}

export function clearLocalSnippets() {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch {
        // ignore
    }
}

function getRemoteCacheKey(userId: string) {
    return `${REMOTE_CACHE_PREFIX}${userId}`;
}

export function readRemoteSnippetsCache(userId: string): SnippetRecord[] {
    const parsed = safeRead<LocalPayload>(getRemoteCacheKey(userId));
    if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.snippets)) {
        return [];
    }
    return parsed.snippets.filter(isSnippetRecord);
}

export function writeRemoteSnippetsCache(userId: string, snippets: SnippetRecord[]) {
    safeWrite(getRemoteCacheKey(userId), { version: 1, snippets } satisfies LocalPayload);
}