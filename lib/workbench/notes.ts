/**
 * Local-first markdown notes. Independent from Snippets (no tags, no remote
 * sync, no public flag) — long-form prose with a live preview. Pure
 * serialize/parse so it can be unit-tested without the DOM.
 */

export interface NoteRecord {
  id: string;
  title: string;
  body: string;
  createdAt: number;
  updatedAt: number;
}

interface NotesPayload {
  version: 1;
  notes: NoteRecord[];
}

const LS_KEY = 'hios-workbench-notes';

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.floor(Math.random() * 1e9).toString(36)}`;
}

export function createNoteDraft(partial?: Partial<NoteRecord>): NoteRecord {
  const now = Date.now();
  return {
    id: newId(),
    title: partial?.title ?? 'Untitled note',
    body: partial?.body ?? '',
    createdAt: now,
    updatedAt: now,
  };
}

export function isNoteRecord(value: unknown): value is NoteRecord {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === 'string' &&
    typeof v.title === 'string' &&
    typeof v.body === 'string' &&
    typeof v.createdAt === 'number' &&
    typeof v.updatedAt === 'number'
  );
}

/** Pure: notes -> JSON string for storage. */
export function serializeNotes(notes: NoteRecord[]): string {
  return JSON.stringify({ version: 1, notes } satisfies NotesPayload);
}

/** Pure: stored string -> notes (tolerant; bad data => []). */
export function parseNotes(raw: string | null): NoteRecord[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (parsed && parsed.version === 1 && Array.isArray(parsed.notes)) {
      return parsed.notes.filter(isNoteRecord);
    }
    return [];
  } catch {
    return [];
  }
}

export function readNotes(): NoteRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    return parseNotes(window.localStorage.getItem(LS_KEY));
  } catch {
    return [];
  }
}

export function writeNotes(notes: NoteRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LS_KEY, serializeNotes(notes));
  } catch {
    /* storage full/unavailable — non-fatal */
  }
}
