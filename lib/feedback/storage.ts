import {
    isFeedbackAuthState,
    FEEDBACK_CAP,
    FEEDBACK_STORAGE_KEY,
    FEEDBACK_STORAGE_VERSION,
    isFeedbackKind,
    isFeedbackSeverity,
    isFeedbackSource,
    type FeedbackEntry,
    type FeedbackPayload,
} from './types';

interface LegacyFeedbackEntry {
    id: string;
    kind: FeedbackEntry['kind'];
    title: string;
    body: string;
    stack?: string;
    url?: string;
    userAgent?: string;
    createdAt: number;
    read: boolean;
}

interface LegacyFeedbackPayload {
    version: 1;
    entries: LegacyFeedbackEntry[];
}

function generateId(): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
        return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.floor(Math.random() * 1e9).toString(36)}`;
}

function isValidEntry(value: unknown): value is FeedbackEntry {
    if (!value || typeof value !== 'object') return false;
    const e = value as Record<string, unknown>;
    return (
        typeof e.id === 'string' &&
        isFeedbackKind(e.kind) &&
        isFeedbackSource(e.source) &&
        isFeedbackSeverity(e.severity) &&
        typeof e.title === 'string' &&
        typeof e.body === 'string' &&
        typeof e.fingerprint === 'string' &&
        typeof e.occurrences === 'number' &&
        typeof e.createdAt === 'number' &&
        typeof e.lastSeenAt === 'number' &&
        typeof e.read === 'boolean' &&
        isFeedbackAuthState(e.authState)
    );
}

function normalizeText(value: string | undefined): string {
    return (value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function firstStackFrame(stack: string | undefined): string {
    if (!stack) return '';
    return stack
        .split('\n')
        .map((line) => line.trim())
        .find((line) => line.length > 0 && !line.toLowerCase().startsWith('error')) ?? '';
}

function parseUrlContext(url: string | undefined): { pathname: string; locale?: string; toolSlug?: string } {
    if (!url) return { pathname: '' };
    try {
        const parsed = new URL(url);
        const segments = parsed.pathname.split('/').filter(Boolean);
        const locale = segments[0];
        let toolSlug: string | undefined;
        if (segments[1] === 'workbench') {
            toolSlug = segments[2] ?? 'landing';
        } else if (segments[1] === 's') {
            toolSlug = 'public-snippet';
        }
        return { pathname: parsed.pathname, locale, toolSlug };
    } catch {
        return { pathname: '' };
    }
}

function inferSeverity(kind: FeedbackEntry['kind']): FeedbackEntry['severity'] {
    switch (kind) {
        case 'error':
            return 'error';
        case 'bug':
            return 'warn';
        case 'idea':
        case 'note':
            return 'info';
    }
}

function inferSource(kind: FeedbackEntry['kind']): FeedbackEntry['source'] {
    return kind === 'error' ? 'runtime' : 'manual';
}

function buildFingerprint(parts: {
    kind: FeedbackEntry['kind'];
    title: string;
    stack?: string;
    url?: string;
}): string {
    const context = parseUrlContext(parts.url);
    return [
        parts.kind,
        normalizeText(parts.title),
        normalizeText(firstStackFrame(parts.stack)),
        normalizeText(context.pathname),
    ].join('::');
}

function migrateLegacyEntry(entry: LegacyFeedbackEntry): FeedbackEntry {
    const fingerprint = buildFingerprint(entry);
    const context = parseUrlContext(entry.url);
    return {
        id: entry.id,
        kind: entry.kind,
        source: inferSource(entry.kind),
        severity: inferSeverity(entry.kind),
        title: entry.title,
        body: entry.body,
        stack: entry.stack,
        url: entry.url,
        userAgent: entry.userAgent,
        fingerprint,
        occurrences: 1,
        createdAt: entry.createdAt,
        lastSeenAt: entry.createdAt,
        read: entry.read,
        buildId: undefined,
        locale: context.locale,
        toolSlug: context.toolSlug,
        authState: 'anonymous',
        userId: undefined,
    };
}

export function readEntries(): FeedbackEntry[] {
    if (typeof window === 'undefined') return [];
    try {
        const raw = window.localStorage.getItem(FEEDBACK_STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw) as FeedbackPayload | LegacyFeedbackPayload | unknown;
        if (
            parsed &&
            typeof parsed === 'object' &&
            (parsed as FeedbackPayload).version === FEEDBACK_STORAGE_VERSION &&
            Array.isArray((parsed as FeedbackPayload).entries)
        ) {
            return (parsed as FeedbackPayload).entries.filter(isValidEntry);
        }
        if (
            parsed &&
            typeof parsed === 'object' &&
            (parsed as LegacyFeedbackPayload).version === 1 &&
            Array.isArray((parsed as LegacyFeedbackPayload).entries)
        ) {
            const migrated = (parsed as LegacyFeedbackPayload).entries
                .filter((entry): entry is LegacyFeedbackEntry => Boolean(entry && typeof entry === 'object'))
                .map(migrateLegacyEntry);
            writeEntries(migrated);
            return migrated;
        }
    } catch {
        // corrupted: lo dejamos como vacío
    }
    return [];
}

export function writeEntries(entries: FeedbackEntry[]): void {
    if (typeof window === 'undefined') return;
    try {
        const payload: FeedbackPayload = {
            version: FEEDBACK_STORAGE_VERSION,
            entries: entries.slice(0, FEEDBACK_CAP),
        };
        window.localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(payload));
    } catch {
        // localStorage lleno o bloqueado: no es fatal
    }
}

export interface AppendDraft {
    kind: FeedbackEntry['kind'];
    title: string;
    body: string;
    stack?: string;
    url?: string;
    userAgent?: string;
    source?: FeedbackEntry['source'];
    severity?: FeedbackEntry['severity'];
    buildId?: string;
    locale?: string;
    toolSlug?: string;
    authState?: FeedbackEntry['authState'];
    userId?: string;
}

export function appendEntry(draft: AppendDraft): FeedbackEntry {
    const now = Date.now();
    const context = parseUrlContext(draft.url);
    const fingerprint = buildFingerprint(draft);
    const entry: FeedbackEntry = {
        id: generateId(),
        kind: draft.kind,
        source: draft.source ?? inferSource(draft.kind),
        severity: draft.severity ?? inferSeverity(draft.kind),
        title: draft.title.trim() || '(sin título)',
        body: draft.body,
        stack: draft.stack,
        url: draft.url,
        userAgent: draft.userAgent,
        fingerprint,
        occurrences: 1,
        createdAt: now,
        lastSeenAt: now,
        read: false,
        buildId: draft.buildId,
        locale: draft.locale ?? context.locale,
        toolSlug: draft.toolSlug ?? context.toolSlug,
        authState: draft.authState ?? 'anonymous',
        userId: draft.userId,
    };

    const currentEntries = readEntries();
    const existingIndex = currentEntries.findIndex((current) => current.fingerprint === fingerprint);
    const next = [...currentEntries];

    if (existingIndex >= 0) {
        const existing = next.splice(existingIndex, 1)[0];
        const merged: FeedbackEntry = {
            ...existing,
            ...entry,
            id: existing.id,
            createdAt: existing.createdAt,
            occurrences: existing.occurrences + 1,
            lastSeenAt: now,
            read: false,
            stack: entry.stack ?? existing.stack,
            url: entry.url ?? existing.url,
            userAgent: entry.userAgent ?? existing.userAgent,
            buildId: entry.buildId ?? existing.buildId,
            locale: entry.locale ?? existing.locale,
            toolSlug: entry.toolSlug ?? existing.toolSlug,
            userId: entry.userId ?? existing.userId,
        };
        next.unshift(merged);
        writeEntries(next);
        return merged;
    }

    next.unshift(entry);
    writeEntries(next);
    return entry;
}

export function deleteEntry(id: string): void {
    writeEntries(readEntries().filter((e) => e.id !== id));
}

export function clearAll(): void {
    writeEntries([]);
}

export function markAllRead(): void {
    writeEntries(readEntries().map((e) => ({ ...e, read: true })));
}

export function countUnread(entries: FeedbackEntry[]): number {
    return entries.reduce((acc, e) => acc + (e.read ? 0 : 1), 0);
}

export function serializeEntry(entry: FeedbackEntry): string {
    const lines = [
        `[${entry.kind.toUpperCase()}] ${entry.title}`,
        `id: ${entry.id}`,
        `source: ${entry.source}`,
        `severity: ${entry.severity}`,
        `fingerprint: ${entry.fingerprint}`,
        `occurrences: ${entry.occurrences}`,
        `createdAt: ${new Date(entry.createdAt).toISOString()}`,
        `lastSeenAt: ${new Date(entry.lastSeenAt).toISOString()}`,
    ];
    if (entry.url) lines.push(`url: ${entry.url}`);
    if (entry.userAgent) lines.push(`userAgent: ${entry.userAgent}`);
    if (entry.locale) lines.push(`locale: ${entry.locale}`);
    if (entry.toolSlug) lines.push(`toolSlug: ${entry.toolSlug}`);
    if (entry.authState) lines.push(`authState: ${entry.authState}`);
    if (entry.userId) lines.push(`userId: ${entry.userId}`);
    if (entry.buildId) lines.push(`buildId: ${entry.buildId}`);
    lines.push('', entry.body);
    if (entry.stack) {
        lines.push('', '--- stack ---', entry.stack);
    }
    return lines.join('\n');
}
