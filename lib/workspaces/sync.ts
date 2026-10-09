import { parseStore, remoteDocument, type StoredDocument, type WorkspaceStore } from './model.ts';

async function fetchRecords(): Promise<StoredDocument[]> {
  const lists = await Promise.all(['workspaces', 'presets'].map(async kind => {
    const response = await fetch(`/api/user/${kind}`, { cache: 'no-store', signal: AbortSignal.timeout(15_000) });
    if (!response.ok) throw new Error('error');
    const data = await response.json();
    return parseStore({ version: 1, records: data.records }).records;
  }));
  return lists.flat();
}

export function mergeRemote(local: StoredDocument[], remote: StoredDocument[]): StoredDocument[] {
  const merged = new Map(local.map(row => [`${row.kind}:${row.id}`, row]));
  for (const row of remote) {
    const key = `${row.kind}:${row.id}`;
    const existing = merged.get(key);
    if (existing?.dirty && existing.revision !== row.revision) {
      merged.set(key, { ...existing, conflict: row.document, revision: row.revision });
    } else if (!existing?.dirty) {
      // A settings-only remote preset must not erase this device's local content.
      const document = row.kind === 'presets' && 'syncContent' in row.document && !row.document.syncContent
        && existing && 'content' in existing.document ? { ...row.document, content: existing.document.content } : row.document;
      merged.set(key, { ...row, document });
    }
  }
  return [...merged.values()];
}

export async function synchronize(store: WorkspaceStore): Promise<WorkspaceStore> {
  let records = mergeRemote(store.records, await fetchRecords());
  for (const row of records) {
    if (!row.dirty || row.conflict) continue;
    const response = await fetch(`/api/user/${row.kind}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(15_000),
      body: JSON.stringify({ ...row, document: remoteDocument(row) }),
    });
    if (response.status === 409) {
      records = mergeRemote(records, await fetchRecords());
      continue;
    }
    if (!response.ok) throw new Error('error');
    const { revision } = await response.json() as { revision: number };
    records = records.map(item => item.id === row.id && item.kind === row.kind ? { ...item, revision, dirty: false } : item);
  }
  return { ...store, records };
}
