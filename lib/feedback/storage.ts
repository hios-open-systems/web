import {
    FEEDBACK_CAP,
    FEEDBACK_STORAGE_KEY,
    FEEDBACK_STORAGE_VERSION,
    isFeedbackKind,
    type FeedbackEntry,
    type FeedbackPayload,
} from './types';

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
        typeof e.title === 'string' &&
        typeof e.body === 'string' &&
        typeof e.createdAt === 'number' &&
        typeof e.read === 'boolean'
    );
}

export function readEntries(): FeedbackEntry[] {
    if (typeof window === 'undefined') return [];
    try {
        const raw = window.localStorage.getItem(FEEDBACK_STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw) as FeedbackPayload | unknown;
        if (
            parsed &&
            typeof parsed === 'object' &&
            (parsed as FeedbackPayload).version === FEEDBACK_STORAGE_VERSION &&
            Array.isArray((parsed as FeedbackPayload).entries)
        ) {
            return (parsed as FeedbackPayload).entries.filter(isValidEntry);
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
}

export function appendEntry(draft: AppendDraft): FeedbackEntry {
    const entry: FeedbackEntry = {
        id: generateId(),
        kind: draft.kind,
        title: draft.title.trim() || '(sin título)',
        body: draft.body,
        stack: draft.stack,
        url: draft.url,
        userAgent: draft.userAgent,
        createdAt: Date.now(),
        read: false,
    };
    const next = [entry, ...readEntries()];
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
        `createdAt: ${new Date(entry.createdAt).toISOString()}`,
    ];
    if (entry.url) lines.push(`url: ${entry.url}`);
    if (entry.userAgent) lines.push(`userAgent: ${entry.userAgent}`);
    lines.push('', entry.body);
    if (entry.stack) {
        lines.push('', '--- stack ---', entry.stack);
    }
    return lines.join('\n');
}
