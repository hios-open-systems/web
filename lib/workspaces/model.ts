import { validSettings } from './presetSettings.ts';
export interface WorkspaceEntry { id: string; resourceId: string; presetId?: string }
export interface Workspace {
  id: string; version: 1; name: string; entries: WorkspaceEntry[]; order?: number;
}
export interface ToolPreset {
  id: string; version: 1; toolId: string; name: string;
  settings: Record<string, string>; content?: Record<string, string>; syncContent: boolean;
}
export type Document = Workspace | ToolPreset;
export interface StoredDocument {
  id: string; kind: 'workspaces' | 'presets'; document: Document;
  revision: number; dirty: boolean; deleted?: boolean; conflict?: Document;
}
export interface WorkspaceStore { version: 1; records: StoredDocument[]; migrated: boolean; activeId?: string }
export const emptyStore = (): WorkspaceStore => ({ version: 1, records: [], migrated: false });
const isRecord = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const validId = (value: unknown): value is string => typeof value === 'string' && /^[\w-]{1,100}$/.test(value);
const strings = (value: unknown): value is Record<string, string> => isRecord(value) && Object.entries(value).length <= 100
  && Object.entries(value).every(([key, val]) => key.length <= 100 && typeof val === 'string' && val.length <= 1_000_000);

export function validDocument(value: unknown, kind: StoredDocument['kind']): value is Document {
  if (!isRecord(value) || !validId(value.id) || value.version !== 1 || typeof value.name !== 'string'
    || !value.name.trim() || value.name.length > 100) return false;
  if (kind === 'workspaces') return (value.order === undefined || (Number.isSafeInteger(value.order) && Number(value.order) >= 0)) && Array.isArray(value.entries) && value.entries.length <= 200
    && value.entries.every(entry => isRecord(entry) && validId(entry.id) && typeof entry.resourceId === 'string'
      && /^[\w:/-]{1,160}$/.test(entry.resourceId) && (entry.presetId === undefined || validId(entry.presetId)));
  return validId(value.toolId) && strings(value.settings) && validSettings(value.toolId, value.settings) && typeof value.syncContent === 'boolean'
    && (value.content === undefined || strings(value.content));
}

export function remoteDocument(record: StoredDocument): Document {
  const doc = record.document;
  if (record.kind === 'presets' && 'syncContent' in doc && !doc.syncContent) {
    const safe = { ...doc };
    delete safe.content;
    return safe;
  }
  return doc;
}

export function parseStore(value: unknown): WorkspaceStore {
  if (!isRecord(value) || value.version !== 1 || !Array.isArray(value.records) || value.records.length > 500) throw new Error('invalidImport');
  for (const row of value.records) {
    if (!isRecord(row) || (row.kind !== 'workspaces' && row.kind !== 'presets') || !validDocument(row.document, row.kind)
      || row.id !== row.document.id || !Number.isInteger(row.revision) || Number(row.revision) < 0 || typeof row.dirty !== 'boolean'
      || (row.deleted !== undefined && typeof row.deleted !== 'boolean')
      || (row.conflict !== undefined && !validDocument(row.conflict, row.kind))) throw new Error('invalidImport');
  }
  return value as unknown as WorkspaceStore;
}

export function makeRecord(document: Document, kind: StoredDocument['kind']): StoredDocument {
  return { id: document.id, kind, document, revision: 0, dirty: true };
}
