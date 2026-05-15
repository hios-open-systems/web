import type { D1Database } from '@cloudflare/workers-types';

export interface SnippetRecord {
    id: string;
    title: string;
    body: string;
    tags: string[];
    isPublic: boolean;
    createdAt: number;
    updatedAt: number;
}

export interface CreateSnippetInput {
    title: string;
    body: string;
    tags?: string[];
    isPublic?: boolean;
}

export interface UpdateSnippetInput {
    title?: string;
    body?: string;
    tags?: string[];
    isPublic?: boolean;
}

interface SnippetRow {
    id: string;
    title: string;
    body: string;
    tags: string | null;
    is_public: number;
    created_at: number;
    updated_at: number;
}

const MAX_TITLE_LENGTH = 120;
const MAX_BODY_LENGTH = 10_000;
const MAX_TAGS = 12;
const MAX_TAG_LENGTH = 24;
export const SNIPPETS_IMPORT_LIMIT = 50;

function generateSnippetId(): string {
    return typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.floor(Math.random() * 1e9).toString(36)}`;
}

function normalizeTag(tag: string): string {
    return tag.trim().replace(/\s+/g, ' ');
}

function normalizeTags(tags: string[] | undefined): string[] {
    if (!tags) return [];
    return Array.from(new Set(tags.map(normalizeTag).filter(Boolean).slice(0, MAX_TAGS))).map((tag) => tag.slice(0, MAX_TAG_LENGTH));
}

function parseTags(value: string | null): string[] {
    if (!value) return [];
    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? normalizeTags(parsed.filter((tag): tag is string => typeof tag === 'string')) : [];
    } catch {
        return [];
    }
}

function serializeTags(tags: string[]): string | null {
    return tags.length > 0 ? JSON.stringify(tags) : null;
}

function mapSnippetRow(row: SnippetRow): SnippetRecord {
    return {
        id: row.id,
        title: row.title,
        body: row.body,
        tags: parseTags(row.tags),
        isPublic: row.is_public === 1,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

function validateTitle(title: string | undefined, required: boolean): string | null {
    if (!title?.trim()) {
        return required ? 'Snippet title is required' : null;
    }
    const normalized = title.trim();
    if (normalized.length > MAX_TITLE_LENGTH) {
        return `Snippet title must be ${MAX_TITLE_LENGTH} characters or less`;
    }
    return null;
}

function validateBody(body: string | undefined, required: boolean): string | null {
    if (!body?.trim()) {
        return required ? 'Snippet body is required' : null;
    }
    const normalized = body.trim();
    if (normalized.length > MAX_BODY_LENGTH) {
        return `Snippet body must be ${MAX_BODY_LENGTH} characters or less`;
    }
    return null;
}

function validateTags(tags: string[] | undefined): string | null {
    if (!tags) return null;
    if (!Array.isArray(tags)) return 'Snippet tags must be an array';
    if (tags.some((tag) => typeof tag !== 'string')) return 'Snippet tags must be strings';
    if (tags.length > MAX_TAGS) return `Snippet tags must be ${MAX_TAGS} items or less`;
    return null;
}

export function validateCreateSnippetInput(input: CreateSnippetInput): string | null {
    return validateTitle(input.title, true) ?? validateBody(input.body, true) ?? validateTags(input.tags);
}

export function validateUpdateSnippetInput(input: UpdateSnippetInput): string | null {
    const hasKnownField = ['title', 'body', 'tags', 'isPublic'].some((key) => key in input);
    if (!hasKnownField) return 'Snippet update payload is empty';
    return validateTitle(input.title, false) ?? validateBody(input.body, false) ?? validateTags(input.tags);
}

export function normalizeCreateSnippetInput(input: CreateSnippetInput): Required<CreateSnippetInput> {
    return {
        title: input.title.trim(),
        body: input.body.trim(),
        tags: normalizeTags(input.tags),
        isPublic: Boolean(input.isPublic),
    };
}

export function normalizeUpdateSnippetInput(input: UpdateSnippetInput): UpdateSnippetInput {
    return {
        title: typeof input.title === 'string' ? input.title.trim() : undefined,
        body: typeof input.body === 'string' ? input.body.trim() : undefined,
        tags: input.tags ? normalizeTags(input.tags) : undefined,
        isPublic: typeof input.isPublic === 'boolean' ? input.isPublic : undefined,
    };
}

export async function listUserSnippets(db: D1Database, userId: string): Promise<SnippetRecord[]> {
    const rows = await db
        .prepare(
            `SELECT id, title, body, tags, is_public, created_at, updated_at
             FROM snippets
             WHERE user_id = ?
             ORDER BY updated_at DESC, created_at DESC`,
        )
        .bind(userId)
        .all<SnippetRow>();

    return (rows.results ?? []).map(mapSnippetRow);
}

export async function getUserSnippetById(db: D1Database, userId: string, snippetId: string): Promise<SnippetRecord | null> {
    const row = await db
        .prepare(
            `SELECT id, title, body, tags, is_public, created_at, updated_at
             FROM snippets
             WHERE id = ? AND user_id = ?
             LIMIT 1`,
        )
        .bind(snippetId, userId)
        .first<SnippetRow>();

    return row ? mapSnippetRow(row) : null;
}

export async function getPublicSnippetById(db: D1Database, snippetId: string): Promise<SnippetRecord | null> {
    const row = await db
        .prepare(
            `SELECT id, title, body, tags, is_public, created_at, updated_at
             FROM snippets
             WHERE id = ? AND is_public = 1
             LIMIT 1`,
        )
        .bind(snippetId)
        .first<SnippetRow>();

    return row ? mapSnippetRow(row) : null;
}

export async function createUserSnippet(db: D1Database, userId: string, input: CreateSnippetInput): Promise<SnippetRecord> {
    const normalized = normalizeCreateSnippetInput(input);
    const now = Date.now();
    const id = generateSnippetId();

    await db
        .prepare(
            `INSERT INTO snippets (id, user_id, title, body, tags, is_public, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(id, userId, normalized.title, normalized.body, serializeTags(normalized.tags), normalized.isPublic ? 1 : 0, now, now)
        .run();

    return {
        id,
        title: normalized.title,
        body: normalized.body,
        tags: normalized.tags,
        isPublic: normalized.isPublic,
        createdAt: now,
        updatedAt: now,
    };
}

export async function updateUserSnippet(
    db: D1Database,
    userId: string,
    snippetId: string,
    input: UpdateSnippetInput,
): Promise<SnippetRecord | null> {
    const existing = await getUserSnippetById(db, userId, snippetId);
    if (!existing) return null;

    const normalized = normalizeUpdateSnippetInput(input);
    const next: SnippetRecord = {
        ...existing,
        title: normalized.title ?? existing.title,
        body: normalized.body ?? existing.body,
        tags: normalized.tags ?? existing.tags,
        isPublic: normalized.isPublic ?? existing.isPublic,
        updatedAt: Date.now(),
    };

    await db
        .prepare(
            `UPDATE snippets
             SET title = ?, body = ?, tags = ?, is_public = ?, updated_at = ?
             WHERE id = ? AND user_id = ?`,
        )
        .bind(next.title, next.body, serializeTags(next.tags), next.isPublic ? 1 : 0, next.updatedAt, snippetId, userId)
        .run();

    return next;
}

export async function deleteUserSnippet(db: D1Database, userId: string, snippetId: string): Promise<boolean> {
    const result = await db
        .prepare('DELETE FROM snippets WHERE id = ? AND user_id = ?')
        .bind(snippetId, userId)
        .run();

    return Boolean(result.meta.changes);
}

function buildImportFingerprint(snippet: Pick<SnippetRecord, 'title' | 'body' | 'tags'>): string {
    return [snippet.title.trim().toLowerCase(), snippet.body.trim(), normalizeTags(snippet.tags).join('|')].join('::');
}

export async function importUserSnippets(
    db: D1Database,
    userId: string,
    snippets: CreateSnippetInput[],
): Promise<{ imported: number; skipped: number; snippets: SnippetRecord[] }> {
    const existing = await listUserSnippets(db, userId);
    const seen = new Set(existing.map((snippet) => buildImportFingerprint(snippet)));
    const created: SnippetRecord[] = [];
    let skipped = 0;

    for (const snippet of snippets.slice(0, SNIPPETS_IMPORT_LIMIT)) {
        const validationError = validateCreateSnippetInput(snippet);
        if (validationError) {
            skipped += 1;
            continue;
        }

        const normalized = normalizeCreateSnippetInput(snippet);
        const fingerprint = buildImportFingerprint(normalized);
        if (seen.has(fingerprint)) {
            skipped += 1;
            continue;
        }

        const createdSnippet = await createUserSnippet(db, userId, normalized);
        seen.add(fingerprint);
        created.push(createdSnippet);
    }

    skipped += Math.max(0, snippets.length - Math.min(snippets.length, SNIPPETS_IMPORT_LIMIT));

    return { imported: created.length, skipped, snippets: created };
}